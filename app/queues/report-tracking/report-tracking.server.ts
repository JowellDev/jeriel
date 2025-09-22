import { Queue } from 'quirrel/remix'
import { prisma } from '~/utils/db.server'
import { startOfWeek, endOfWeek } from 'date-fns'

export const reportTrackingQueue = Queue('queues/report-tracking', async () => {
	try {
		console.log('Démarrage de la synchronisation du suivi des rapports')

		if (process.env.ENABLE_TRACKING_CLEANUP === 'true') {
			await cleanupOldTrackingEntries()
		}

		const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
		const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
		console.log(
			`📅 Semaine: ${currentWeekStart.toLocaleDateString()} - ${currentWeekEnd.toLocaleDateString()}`,
		)

		const churches = await prisma.church.findMany({
			where: { isActive: true },
			select: { id: true, name: true },
		})

		let totalProcessed = 0
		let totalCreated = 0

		for (const church of churches) {
			const result = await processChurchEntities(
				church.id,
				church.name,
				currentWeekStart,
				currentWeekEnd,
			)
			totalProcessed += result.processed
			totalCreated += result.created
		}

		console.log(
			`✅ Terminé: ${totalCreated} nouvelles entrées créées sur ${totalProcessed} entités traitées`,
		)

		console.log('Fin de la synchronisation du suivi des rapports')
	} catch (error) {
		console.error('Erreur lors de la synchronisation du suivi:', error)
		throw error
	}
})

async function cleanupOldTrackingEntries() {
	const sixMonthsAgo = new Date()
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

	try {
		const deleteResult = await prisma.reportTracking.deleteMany({
			where: {
				createdAt: {
					lt: sixMonthsAgo,
				},
			},
		})

		if (deleteResult.count > 0) {
			console.log(
				`🗑️  Nettoyage: ${deleteResult.count} anciennes entrées supprimées (> 6 mois)`,
			)
		}
	} catch (error) {
		console.error('Erreur lors du nettoyage des anciennes entrées:', error)
	}
}

async function processEntitiesInChunks<T>(
	entities: T[],
	chunkSize: number,
	processor: (chunk: T[]) => Promise<void>,
): Promise<void> {
	for (let i = 0; i < entities.length; i += chunkSize) {
		const chunk = entities.slice(i, i + chunkSize)
		await processor(chunk)
	}
}

async function processChurchEntities(
	churchId: string,
	churchName: string,
	currentWeekStart: Date,
	currentWeekEnd: Date,
): Promise<{ processed: number; created: number }> {
	const [tribes, departments, honorFamilies] = await Promise.all([
		prisma.tribe.findMany({
			where: { churchId, managerId: { not: null } },
			select: { id: true, name: true, managerId: true },
		}),
		prisma.department.findMany({
			where: { churchId, managerId: { not: null } },
			select: { id: true, name: true, managerId: true },
		}),
		prisma.honorFamily.findMany({
			where: { churchId, managerId: { not: null } },
			select: { id: true, name: true, managerId: true },
		}),
	])

	const allEntities = [
		...tribes.map(t => ({
			type: 'TRIBE' as const,
			id: t.id,
			name: t.name,
			managerId: t.managerId!,
		})),
		...departments.map(d => ({
			type: 'DEPARTMENT' as const,
			id: d.id,
			name: d.name,
			managerId: d.managerId!,
		})),
		...honorFamilies.map(h => ({
			type: 'HONOR_FAMILY' as const,
			id: h.id,
			name: h.name,
			managerId: h.managerId!,
		})),
	]

	if (allEntities.length === 0) {
		return { processed: 0, created: 0 }
	}

	const CHUNK_SIZE = 200
	let totalCreated = 0

	await processEntitiesInChunks(allEntities, CHUNK_SIZE, async entityChunk => {
		const result = await processEntityChunk(
			entityChunk,
			currentWeekStart,
			currentWeekEnd,
		)
		totalCreated += result.created
	})

	if (totalCreated > 0) {
		console.log(
			`⛪ ${churchName}: ${totalCreated} nouvelles entrées / ${allEntities.length} entités`,
		)
	}

	return { processed: allEntities.length, created: totalCreated }
}

async function processEntityChunk(
	entityChunk: Array<{
		type: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
		id: string
		name: string
		managerId: string
	}>,
	currentWeekStart: Date,
	currentWeekEnd: Date,
): Promise<{ created: number }> {
	const existingTrackings = await prisma.reportTracking.findMany({
		where: {
			OR: entityChunk.map(entity => ({
				entity: entity.type,
				...(entity.type === 'TRIBE' && { tribeId: entity.id }),
				...(entity.type === 'DEPARTMENT' && { departmentId: entity.id }),
				...(entity.type === 'HONOR_FAMILY' && { honorFamilyId: entity.id }),
				submitterId: entity.managerId,
				createdAt: { gte: currentWeekStart, lte: currentWeekEnd },
			})),
		},
		select: {
			entity: true,
			tribeId: true,
			departmentId: true,
			honorFamilyId: true,
			submitterId: true,
		},
	})

	const existingSet = new Set(
		existingTrackings.map(
			t =>
				`${t.entity}-${t.tribeId || t.departmentId || t.honorFamilyId}-${t.submitterId}`,
		),
	)

	const entitiesToProcess = entityChunk.filter(
		entity =>
			!existingSet.has(`${entity.type}-${entity.id}-${entity.managerId}`),
	)

	if (entitiesToProcess.length === 0) {
		return { created: 0 }
	}

	const weeklyReports = await prisma.attendanceReport.findMany({
		where: {
			OR: entitiesToProcess.map(entity => ({
				entity: entity.type,
				...(entity.type === 'TRIBE' && { tribeId: entity.id }),
				...(entity.type === 'DEPARTMENT' && { departmentId: entity.id }),
				...(entity.type === 'HONOR_FAMILY' && { honorFamilyId: entity.id }),
				submitterId: entity.managerId,
				createdAt: { gte: currentWeekStart, lte: currentWeekEnd },
			})),
		},
		select: {
			id: true,
			entity: true,
			tribeId: true,
			departmentId: true,
			honorFamilyId: true,
			submitterId: true,
			createdAt: true,
		},
		orderBy: { createdAt: 'desc' },
	})

	const reportsByEntity = new Map<string, (typeof weeklyReports)[0]>()
	weeklyReports.forEach(report => {
		const key = `${report.entity}-${report.tribeId || report.departmentId || report.honorFamilyId}-${report.submitterId}`
		if (!reportsByEntity.has(key)) {
			reportsByEntity.set(key, report)
		}
	})

	const trackingEntries = entitiesToProcess.map(entity => {
		const key = `${entity.type}-${entity.id}-${entity.managerId}`
		const report = reportsByEntity.get(key)

		return {
			entity: entity.type,
			...(entity.type === 'TRIBE' && { tribeId: entity.id }),
			...(entity.type === 'DEPARTMENT' && { departmentId: entity.id }),
			...(entity.type === 'HONOR_FAMILY' && { honorFamilyId: entity.id }),
			submitterId: entity.managerId,
			submittedAt: report?.createdAt || null,
			reportId: report?.id || null,
		}
	})

	if (trackingEntries.length > 0) {
		try {
			await prisma.reportTracking.createMany({
				data: trackingEntries,
				skipDuplicates: true,
			})
			return { created: trackingEntries.length }
		} catch (error) {
			console.error(`❌ Erreur batch chunk:`, error)
			let individualCreated = 0
			for (const entry of trackingEntries) {
				try {
					await prisma.reportTracking.create({ data: entry })
					individualCreated++
				} catch {}
			}
			return { created: individualCreated }
		}
	}

	return { created: 0 }
}
