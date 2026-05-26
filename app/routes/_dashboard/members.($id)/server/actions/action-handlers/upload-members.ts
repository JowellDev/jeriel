import { parseWithZod } from '@conform-to/zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { Role, type MaritalStatus } from '@prisma/client'
import { uploadMembersSchema } from '../../../schema'
import {
	type MemberData,
	processExcelFile,
} from '~/helpers/process-members-upload.server'

import { appLogger } from '~/helpers/logging'

const logger = appLogger.child({ module: 'upload-members' })

export async function handleUploadMembers(
	formData: FormData,
	churchId: string,
) {
	const submission = parseWithZod(formData, { schema: uploadMembersSchema })

	if (submission.status !== 'success') return submission.reply()

	try {
		const { data: members, errors } = await processExcelFile(
			submission.value.file as File,
		)

		logger.info('Members extracted from file', {
			extra: { membersCount: members.length, errorsCount: errors.length },
		})

		if (errors.length) {
			return {
				...submission.reply(),
				error: errors.join('\n'),
			}
		}

		await upsertMembers(members, churchId)

		return { status: 'success' }
	} catch (error: any) {
		logger.error('Error during member upload', {
			extra: { error, churchId },
		})
		return {
			...submission.reply(),
			error: 'Fichier invalide ! Veuillez télécharger le modèle.',
		}
	}
}

async function upsertMembers(members: MemberData[], churchId: string) {
	if (!members.length) return

	const { tribes, departments, honorFamilies } = getMembersEntities(members)

	const [dbTribes, dbDepartements, dbFamilies] = await Promise.all([
		findOrCreateTribes(tribes, churchId),
		findOrCreateDepartments(departments, churchId),
		findOrCreateHonorFamilies(honorFamilies, churchId),
	])

	// Maps pour lookup O(1) insensible à la casse au lieu de scans O(N)
	const tribesMap = new Map(dbTribes.map(t => [t.name.toLowerCase(), t.id]))
	const dptMap = new Map(dbDepartements.map(d => [d.name.toLowerCase(), d.id]))
	const familiesMap = new Map(dbFamilies.map(f => [f.name.toLowerCase(), f.id]))

	// Batch lookup de tous les membres existants en une seule requête au lieu de N requêtes
	const memberNames = members.map(m => m.name)
	const existingUsers = await prisma.user.findMany({
		where: {
			churchId,
			name: { in: memberNames },
		},
		select: {
			id: true,
			name: true,
			tribeId: true,
			departmentId: true,
			honorFamilyId: true,
		},
	})

	const existingByName = new Map(
		existingUsers.map(u => [u.name.toLowerCase(), u]),
	)

	logger.info('Starting member upsert', {
		extra: { totalMembers: members.length },
	})

	let created = 0
	let updated = 0
	let errors = 0

	for (const member of members) {
		try {
			const { birthday, tribe, department, honorFamily } = member

			const tribeId = tribe
				? (tribesMap.get(tribe.toLowerCase()) ?? null)
				: null
			const dptId = department
				? (dptMap.get(department.toLowerCase()) ?? null)
				: null
			const familyId = honorFamily
				? (familiesMap.get(honorFamily.toLowerCase()) ?? null)
				: null

			const payload = {
				name: member.name,
				phone: member.phone,
				email: member.email,
				location: member.location,
				gender: member.gender,
				maritalStatus: member.maritalStatus as MaritalStatus | null,
				...(birthday && { birthday }),
				...(tribeId && { tribe: { connect: { id: tribeId } } }),
				...(dptId && { department: { connect: { id: dptId } } }),
				...(familyId && { honorFamily: { connect: { id: familyId } } }),
			}

			const user = existingByName.get(member.name.toLowerCase())

			if (user) {
				const now = new Date()
				const integrationDateFields: Record<string, Date | null> = {}
				if (tribeId && tribeId !== user.tribeId)
					integrationDateFields.tribeDate = now
				if (dptId && dptId !== user.departmentId)
					integrationDateFields.departementDate = now
				if (familyId && familyId !== user.honorFamilyId)
					integrationDateFields.familyDate = now

				await prisma.user.update({
					where: { id: user.id },
					data: {
						...payload,
						...(Object.keys(integrationDateFields).length > 0 && {
							integrationDate: {
								upsert: {
									create: integrationDateFields,
									update: integrationDateFields,
								},
							},
						}),
					},
				})

				updated++
				continue
			}

			await prisma.user.create({
				data: {
					...payload,
					church: { connect: { id: churchId } },
					roles: { set: [Role.MEMBER] },
					integrationDate: {
						create: {
							tribeDate: tribeId ? new Date() : null,
							departementDate: dptId ? new Date() : null,
							familyDate: familyId ? new Date() : null,
						},
					},
				},
			})

			created++
		} catch (error: any) {
			errors++
			logger.error('Failed to upsert member', {
				extra: {
					error,
					memberName: member.name,
					errorMessage: error.message,
				},
			})
		}
	}

	logger.info('Member upsert completed', {
		extra: { created, updated, errors },
	})
}

function getMembersEntities(members: MemberData[]) {
	const tribes = new Set<string>()
	const departments = new Set<string>()
	const honorFamilies = new Set<string>()

	for (const { tribe, department, honorFamily } of members) {
		tribe && tribes.add(tribe)
		department && departments.add(department)
		honorFamily && honorFamilies.add(honorFamily)
	}

	return {
		tribes: [...tribes],
		departments: [...departments],
		honorFamilies: [...honorFamilies],
	}
}

async function findOrCreateTribes(tribes: string[], churchId: string) {
	if (!tribes.length) return []

	const existing = await prisma.tribe.findMany({
		where: { name: { in: tribes } },
		select: { id: true, name: true },
	})

	const existingNamesLower = new Set(existing.map(t => t.name.toLowerCase()))
	const missing = tribes.filter(
		name => !existingNamesLower.has(name.toLowerCase()),
	)

	const created = await Promise.all(
		missing.map(name =>
			prisma.tribe.create({
				data: { name, church: { connect: { id: churchId } } },
				select: { id: true, name: true },
			}),
		),
	)

	return [...existing, ...created]
}

async function findOrCreateDepartments(
	departments: string[],
	churchId: string,
) {
	if (!departments.length) return []

	const existing = await prisma.department.findMany({
		where: { name: { in: departments } },
		select: { id: true, name: true },
	})

	const existingNamesLower = new Set(existing.map(d => d.name.toLowerCase()))
	const missing = departments.filter(
		name => !existingNamesLower.has(name.toLowerCase()),
	)

	const created = await Promise.all(
		missing.map(name =>
			prisma.department.create({
				data: { name, church: { connect: { id: churchId } } },
				select: { id: true, name: true },
			}),
		),
	)

	return [...existing, ...created]
}

async function findOrCreateHonorFamilies(families: string[], churchId: string) {
	if (!families.length) return []

	const existing = await prisma.honorFamily.findMany({
		where: { name: { in: families } },
		select: { id: true, name: true },
	})

	const existingNamesLower = new Set(existing.map(f => f.name.toLowerCase()))
	const missing = families.filter(
		name => !existingNamesLower.has(name.toLowerCase()),
	)

	const created = await Promise.all(
		missing.map(name =>
			prisma.honorFamily.create({
				data: { name, location: 'N/D', church: { connect: { id: churchId } } },
				select: { id: true, name: true },
			}),
		),
	)

	return [...existing, ...created]
}
