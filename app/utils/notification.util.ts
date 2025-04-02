import { type AttendanceReportEntity } from '@prisma/client'
import { prisma } from './db.server'
import { fr } from 'date-fns/locale'
import { format } from 'date-fns'
import { notificationQueue } from '~/queues/notifications/notifications.server'
import invariant from 'tiny-invariant'

export async function notifyAdminForReport(
	reportId: string,
	entity: AttendanceReportEntity,
	submitterId: string,
) {
	const report = await prisma.attendanceReport.findUnique({
		where: { id: reportId },
		include: {
			submitter: { select: { name: true } },
			department: { select: { name: true } },
			tribe: { select: { name: true } },
			honorFamily: { select: { name: true } },
		},
	})

	if (!report) return

	const churchAdmin = await prisma.user.findFirst({
		where: { roles: { has: 'ADMIN' } },
		select: { id: true, name: true },
	})

	invariant(churchAdmin, "L'admin est requis pour l'église")

	let entityName = ''
	if (entity === 'DEPARTMENT' && report.department) {
		entityName = `le département ${report.department.name}`
	} else if (entity === 'TRIBE' && report.tribe) {
		entityName = `la tribu ${report.tribe.name}`
	} else if (entity === 'HONOR_FAMILY' && report.honorFamily) {
		entityName = `la famille d'honneur ${report.honorFamily.name}`
	}

	const submitterName = `${report.submitter.name}`
	const reportDate = format(new Date(report.createdAt), 'PPPP', { locale: fr })
	const title = `Nouveau rapport de présence`
	const content = `${submitterName} a soumis un rapport de présence pour ${entityName} pour le ${reportDate}.`
	const url = `/reports`

	if (churchAdmin?.id === submitterId) return

	await notificationQueue.enqueue({
		inApp: {
			title,
			content,
			url,
			userId: churchAdmin?.id,
		},
	})
}

export async function notifyAdminAboutArchiveRequest(
	archiveRequestId: string,
	requesterId: string,
) {
	const archiveRequest = await prisma.archiveRequest.findFirst({
		where: { id: archiveRequestId },
		include: {
			requester: {
				select: { name: true },
			},
			usersToArchive: {
				select: { name: true },
			},
			church: {
				select: { name: true },
			},
		},
	})

	if (!archiveRequest) return

	const churchAdmin = await prisma.user.findFirst({
		where: {
			roles: { has: 'ADMIN' },
			churchId: archiveRequest.churchId,
		},
		select: {
			id: true,
			name: true,
		},
	})

	if (!churchAdmin) return

	const requesterName = `${archiveRequest.requester.name}`
	const userCount = archiveRequest.usersToArchive.length

	const title = `Nouvelle demande d'archivage`
	const content = `${requesterName} a demandé l'archivage de ${userCount} utilisateur(s) depuis ${archiveRequest.origin}.`
	const url = `/archives`

	if (churchAdmin.id === requesterId) return

	await notificationQueue.enqueue({
		inApp: {
			title,
			content,
			url,
			userId: churchAdmin.id,
		},
	})
}

export async function notifyRequesterAboutArchiveAction(
	usersToArchiveIds: string[],
	requesterId: string,
	action: 'archivate' | 'unarchivate',
	currentUserId: string,
) {
	if (currentUserId === requesterId) return

	const usersToArchive = await prisma.user.findMany({
		where: { id: { in: usersToArchiveIds } },
		select: { name: true },
	})

	const requester = await prisma.user.findUnique({
		where: { id: requesterId },
		select: { id: true, name: true },
	})

	if (!requester) return

	const currentUser = await prisma.user.findUnique({
		where: { id: currentUserId },
		select: { name: true },
	})

	if (!currentUser) return

	const userCount = usersToArchive.length
	const userNames = usersToArchive.map(user => user.name).join(', ')

	let title, content, url

	if (action === 'archivate') {
		title = `Demande d'archivage traitée`
		content = `${currentUser.name} a archivé ${userCount} utilisateur(s) que vous avez demandé: ${userNames}.`
		url = `/archives-request`
	} else {
		title = `Désarchivage d'utilisateur`
		content = `${currentUser.name} a désarchivé l'utilisateur que vous aviez demandé.`
		url = `/archives-request`
	}

	await notificationQueue.enqueue({
		inApp: {
			title,
			content,
			url,
			userId: requester.id,
		},
	})
}
