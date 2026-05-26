import { type AttendanceReportEntity } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'
import { fr } from 'date-fns/locale'
import { format } from 'date-fns'
import { notificationQueue } from '~/queues/notifications.queue'
import invariant from 'tiny-invariant'

interface NotificationDataForAddedMember {
	memberName: string
	entity: AttendanceReportEntity
	entityId: string
	churchId: string
	managerId: string
}

interface NotificationProps {
	entityId: string
	role: 'DEPARTMENT_MANAGER' | 'TRIBE_MANAGER'
	from: Date
	to: Date
	action: 'create' | 'update' | 'delete'
}

async function fetchChurchAdmin(churchId?: string) {
	return prisma.user.findFirst({
		where: { roles: { has: 'ADMIN' }, ...(churchId ? { churchId } : {}) },
		select: { id: true, name: true },
	})
}

async function fetchReportWithDetails(reportId: string) {
	return prisma.attendanceReport.findUnique({
		where: { id: reportId },
		include: {
			submitter: { select: { name: true } },
			department: { select: { name: true } },
			tribe: { select: { name: true } },
			honorFamily: { select: { name: true } },
			attendances: { select: { date: true }, take: 1 },
		},
	})
}

function buildEntityNameLabel(entity: AttendanceReportEntity, report: any): string {
	if (entity === 'DEPARTMENT' && report.department) return `le département ${report.department.name}`
	if (entity === 'TRIBE' && report.tribe) return `la tribu ${report.tribe.name}`
	if (entity === 'HONOR_FAMILY' && report.honorFamily) return `la famille d'honneur ${report.honorFamily.name}`
	return ''
}

export async function notifyAdminForReport(
	reportId: string,
	entity: AttendanceReportEntity,
	submitterId: string,
) {
	const report = await fetchReportWithDetails(reportId)
	if (!report) return

	const churchAdmin = await fetchChurchAdmin()
	invariant(churchAdmin, "L'admin est requis pour l'église")
	if (churchAdmin.id === submitterId) return

	const entityName = buildEntityNameLabel(entity, report)
	const reportDate = format(new Date(report.attendances[0].date), 'PPPP', { locale: fr })
	const content = `${report.submitter.name} a soumis un rapport de présence pour ${entityName} pour le ${reportDate}.`

	await enqueueInAppNotification('Nouveau rapport de présence', content, '/reports', churchAdmin.id)
}

async function fetchAddedMemberNotificationData(
	entity: AttendanceReportEntity,
	entityId: string,
	churchId: string,
	managerId: string,
) {
	return Promise.all([
		prisma.user.findFirst({ where: { roles: { has: 'ADMIN' }, churchId }, select: { id: true, name: true } }),
		prisma.user.findUniqueOrThrow({ where: { id: managerId, churchId }, select: { id: true, name: true } }),
		getEntityDetails(entity, entityId),
	])
}

export async function notifyAdminForAddedMemberInEntity({
	memberName,
	entity,
	entityId,
	churchId,
	managerId,
}: NotificationDataForAddedMember) {
	invariant(churchId, 'churchId is required')

	const [churchAdmin, manager, entityDetails] = await fetchAddedMemberNotificationData(
		entity,
		entityId,
		churchId,
		managerId,
	)
	if (!churchAdmin || !entityDetails || churchAdmin.id === manager.id) return

	const entityTypeMap = { TRIBE: 'la tribu', DEPARTMENT: 'le département', HONOR_FAMILY: "la famille d'honneur" }
	const entityType = entityTypeMap[entity] || 'entité'
	const content = `${manager.name} a ajouté ${memberName} dans ${entityType} "${entityDetails.name}"`
	await enqueueInAppNotification('Nouveau membre ajouté !!', content, '/members', churchAdmin.id)
}

async function fetchArchiveRequestDetails(archiveRequestId: string) {
	return prisma.archiveRequest.findFirst({
		where: { id: archiveRequestId },
		include: {
			requester: { select: { name: true } },
			usersToArchive: { select: { name: true } },
			church: { select: { name: true } },
		},
	})
}

export async function notifyAdminAboutArchiveRequest(archiveRequestId: string, requesterId: string) {
	const archiveRequest = await fetchArchiveRequestDetails(archiveRequestId)
	if (!archiveRequest) return

	const churchAdmin = await fetchChurchAdmin(archiveRequest.churchId)
	if (!churchAdmin || churchAdmin.id === requesterId) return

	const userCount = archiveRequest.usersToArchive.length
	const content = `${archiveRequest.requester.name} a demandé l'archivage de ${userCount} utilisateur(s) depuis ${archiveRequest.origin}.`
	await enqueueInAppNotification("Nouvelle demande d'archivage", content, '/archives', churchAdmin.id)
}

async function fetchArchiveActionParticipants(
	usersToArchiveIds: string[],
	requesterId: string,
	currentUserId: string,
) {
	return Promise.all([
		prisma.user.findMany({ where: { id: { in: usersToArchiveIds } }, select: { name: true } }),
		prisma.user.findUnique({ where: { id: requesterId }, select: { id: true, name: true } }),
		prisma.user.findUnique({ where: { id: currentUserId }, select: { name: true } }),
	])
}

function buildArchiveActionMessage(
	action: 'archivate' | 'unarchivate',
	currentUserName: string,
	userCount: number,
	userNames: string,
): { title: string; content: string; url: string } {
	const url = '/archives-request'
	if (action === 'archivate') {
		return {
			title: "Demande d'archivage traitée",
			content: `${currentUserName} a archivé ${userCount} utilisateur(s) que vous avez demandé: ${userNames}.`,
			url,
		}
	}
	return {
		title: "Désarchivage d'utilisateur",
		content: `${currentUserName} a désarchivé l'utilisateur que vous aviez demandé.`,
		url,
	}
}

export async function notifyRequesterAboutArchiveAction(
	usersToArchiveIds: string[],
	requesterId: string,
	action: 'archivate' | 'unarchivate',
	currentUserId: string,
) {
	if (currentUserId === requesterId) return

	const [usersToArchive, requester, currentUser] = await fetchArchiveActionParticipants(
		usersToArchiveIds,
		requesterId,
		currentUserId,
	)
	if (!requester || !currentUser) return

	const userNames = usersToArchive.map(u => u.name).join(', ')
	const { title, content, url } = buildArchiveActionMessage(
		action,
		currentUser.name,
		usersToArchive.length,
		userNames,
	)
	await enqueueInAppNotification(title, content, url, requester.id)
}

async function fetchEntityManagers(entityId: string, role: 'DEPARTMENT_MANAGER' | 'TRIBE_MANAGER') {
	return prisma.user.findMany({
		where: {
			AND: [
				{ roles: { has: role } },
				{ OR: [{ tribeId: entityId }, { departmentId: entityId }] },
			],
		},
		select: { id: true },
	})
}

function buildServiceActionMessage(
	action: 'create' | 'update' | 'delete',
	entityName: string,
	fromDate: string,
	toDate: string,
): { title: string; content: string } {
	if (action === 'create') {
		return {
			title: `Nouveau service pour votre ${entityName}`,
			content: `Une période de service a été définie du ${fromDate} au ${toDate} pour votre ${entityName}.`,
		}
	}
	if (action === 'update') {
		return {
			title: `Modification d'un service de votre ${entityName}`,
			content: `La période de service pour votre ${entityName} a été modifiée. Elle est maintenant du ${fromDate} au ${toDate}.`,
		}
	}
	return {
		title: `Suppression d'un service de votre ${entityName}`,
		content: `La période de service du ${fromDate} au ${toDate} pour votre ${entityName} a été supprimée.`,
	}
}

export async function notifyManagerForServiceAction({ entityId, role, from, to, action }: NotificationProps) {
	const entityName = role === 'DEPARTMENT_MANAGER' ? 'département' : 'tribu'
	const entityManagers = await fetchEntityManagers(entityId, role)
	const fromDate = format(new Date(from), 'PPPP', { locale: fr })
	const toDate = format(new Date(to), 'PPPP', { locale: fr })
	const { title, content } = buildServiceActionMessage(action, entityName, fromDate, toDate)

	return Promise.all(
		entityManagers.map(manager => enqueueInAppNotification(title, content, '/services', manager.id)),
	)
}

async function fetchConflictParticipants(userId: string, tribeId: string, departmentId: string) {
	return Promise.all([
		prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, churchId: true } }),
		prisma.tribe.findUnique({ where: { id: tribeId }, select: { name: true } }),
		prisma.department.findUnique({ where: { id: departmentId }, select: { name: true } }),
	])
}

export async function notifyAdminForAttendanceConflicts(
	userId: string,
	conflictDate: string,
	tribeId: string,
	departmentId: string,
) {
	const [user, tribe, department] = await fetchConflictParticipants(userId, tribeId, departmentId)
	if (!user?.churchId || !tribe || !department) return

	const churchAdmin = await fetchChurchAdmin(user.churchId)
	if (!churchAdmin) return

	const formattedDate = new Date(conflictDate).toLocaleDateString('fr-FR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	})
	const content = `Conflit détecté pour ${user.name} le ${formattedDate} entre la tribu "${tribe.name}" et le département "${department.name}"`
	await enqueueInAppNotification('Conflit de présence détecté', content, '/reports', churchAdmin.id)
}

async function enqueueInAppNotification(title: string, content: string, url: string, userId: string) {
	return notificationQueue.add('send-notification', {
		inApp: { title, content, url, userId },
	})
}

async function getEntityDetails(entity: AttendanceReportEntity, entityId: string) {
	if (entity === 'TRIBE') return prisma.tribe.findUnique({ where: { id: entityId }, select: { name: true } })
	if (entity === 'DEPARTMENT') return prisma.department.findUnique({ where: { id: entityId }, select: { name: true } })
	if (entity === 'HONOR_FAMILY') return prisma.honorFamily.findUnique({ where: { id: entityId }, select: { name: true } })
	return null
}
