import { type AttendanceReportEntity } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'
import { fr } from 'date-fns/locale'
import { format } from 'date-fns'
import { notificationQueue } from '~/queues/notifications/notifications.server'
import invariant from 'tiny-invariant'

async function enqueueInAppNotification(
	title: string,
	content: string,
	url: string,
	userId: string,
) {
	return notificationQueue.add('send-notification', {
		inApp: {
			title,
			content,
			url,
			userId,
		},
	})
}

interface NotificationDataForAddedMember {
	memberName: string
	entity: AttendanceReportEntity
	entityId: string
	churchId: string
	managerId: string
}

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
			attendances: { select: { date: true }, take: 1 },
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
	const reportDate = format(new Date(report.attendances[0].date), 'PPPP', {
		locale: fr,
	})
	const title = `Nouveau rapport de présence`
	const content = `${submitterName} a soumis un rapport de présence pour ${entityName} pour le ${reportDate}.`
	const url = `/reports`

	if (churchAdmin?.id === submitterId) return

	await enqueueInAppNotification(title, content, url, churchAdmin.id)
}

export async function notifyAdminForAddedMemberInEntity({
	memberName,
	entity,
	entityId,
	churchId,
	managerId,
}: NotificationDataForAddedMember) {
	invariant(churchId, 'churchId ies required')

	const [churchAdmin, manager, entityDetails] = await Promise.all([
		prisma.user.findFirst({
			where: { roles: { has: 'ADMIN' }, churchId },
			select: { id: true, name: true },
		}),
		prisma.user.findUniqueOrThrow({
			where: { id: managerId, churchId },
			select: { id: true, name: true },
		}),
		getEntityDetails(entity, entityId),
	])

	if (!churchAdmin || !entityDetails || churchAdmin?.id === manager?.id) return

	const entityTypeMap = {
		TRIBE: 'la tribu',
		DEPARTMENT: 'le département',
		HONOR_FAMILY: "la famille d'honneur",
	}
	const entityType = entityTypeMap[entity] || 'entité'

	const title = 'Nouveau membre ajouté !!'
	const content = `${manager.name} a ajouté ${memberName} dans ${entityType} "${entityDetails.name}"`
	await enqueueInAppNotification(title, content, '/members', churchAdmin.id)
}

async function getEntityDetails(
	entity: AttendanceReportEntity,
	entityId: string,
) {
	switch (entity) {
		case 'TRIBE':
			return prisma.tribe.findUnique({
				where: { id: entityId },
				select: { name: true },
			})
		case 'DEPARTMENT':
			return prisma.department.findUnique({
				where: { id: entityId },
				select: { name: true },
			})
		case 'HONOR_FAMILY':
			return prisma.honorFamily.findUnique({
				where: { id: entityId },
				select: { name: true },
			})
		default:
			return null
	}
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

	await enqueueInAppNotification(title, content, url, churchAdmin.id)
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

	await enqueueInAppNotification(title, content, url, requester.id)
}

interface NotificationProps {
	entityId: string
	role: 'DEPARTMENT_MANAGER' | 'TRIBE_MANAGER'
	from: Date
	to: Date
	action: 'create' | 'update' | 'delete'
}

export async function notifyManagerForServiceAction({
	entityId,
	role,
	from,
	to,
	action,
}: NotificationProps) {
	const entityName = role === 'DEPARTMENT_MANAGER' ? 'département' : 'tribu'

	const entityManagers = await prisma.user.findMany({
		where: {
			AND: [
				{ roles: { has: role } },
				{
					OR: [{ tribeId: entityId }, { departmentId: entityId }],
				},
			],
		},
		select: {
			id: true,
		},
	})

	const fromDate = format(new Date(from), 'PPPP', { locale: fr })
	const toDate = format(new Date(to), 'PPPP', { locale: fr })

	let title, content

	switch (action) {
		case 'create':
			title = `Nouveau service pour votre ${entityName}`
			content = `Une période de service a été définie du ${fromDate} au ${toDate} pour votre ${entityName}.`
			break
		case 'update':
			title = `Modification d'un service de votre ${entityName}`
			content = `La période de service pour votre ${entityName} a été modifiée. Elle est maintenant du ${fromDate} au ${toDate}.`
			break
		case 'delete':
			title = `Suppression d'un service de votre ${entityName}`
			content = `La période de service du ${fromDate} au ${toDate} pour votre ${entityName} a été supprimée.`
			break
	}

	const url = `/services`

	const notificationPromises = entityManagers.map(manager => {
		return enqueueInAppNotification(title, content, url, manager.id)
	})

	return Promise.all(notificationPromises)
}

export async function notifyAdminForAttendanceConflicts(
	userId: string,
	conflictDate: string,
	tribeId: string,
	departmentId: string,
) {
	const [user, tribe, department] = await Promise.all([
		prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				churchId: true,
			},
		}),
		prisma.tribe.findUnique({
			where: { id: tribeId },
			select: { name: true },
		}),
		prisma.department.findUnique({
			where: { id: departmentId },
			select: { name: true },
		}),
	])

	if (!user?.churchId || !tribe || !department) return

	const churchAdmin = await prisma.user.findFirst({
		where: {
			roles: { has: 'ADMIN' },
			churchId: user.churchId,
		},
		select: { id: true, name: true },
	})

	if (!churchAdmin) return

	const formattedDate = new Date(conflictDate).toLocaleDateString('fr-FR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	})

	const url = '/reports'
	const title = 'Conflit de présence détecté'
	const content = `Conflit détecté pour ${user.name} le ${formattedDate} entre la tribu "${tribe.name}" et le département "${department.name}"`

	await enqueueInAppNotification(title, content, url, churchAdmin.id)
}
