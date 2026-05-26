import { prisma } from '~/infrastructures/database/prisma.server'
import { notificationQueue } from '~/queues/notifications.queue'
import {
	format,
	startOfWeek,
	endOfWeek,
	isWithinInterval,
	addDays,
	getMonth,
	isValid,
	getDate,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { appLogger } from './logging'

const logger = appLogger.child({ module: 'birthdays' })

interface ManagerWithEntity {
	id: string
	name: string
	entityType: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
	entityName: string
	entityId: string
}

interface MemberWithBirthday {
	id: string
	name: string
	birthday: Date
	entityType: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
	entityName: string
	managerId: string
}

export async function notifyManagersAboutUpcomingBirthdays() {
	try {
		logger.info('Starting birthday notifications')

		const today = new Date()
		const nextMonday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7)
		const nextSunday = endOfWeek(nextMonday, { weekStartsOn: 1 })

		logger.info('Checking period for birthdays', {
			extra: {
				startDate: format(nextMonday, 'dd/MM/yyyy'),
				endDate: format(nextSunday, 'dd/MM/yyyy'),
			},
		})

		const managers = await getAllManagersWithEntities()

		await Promise.all(
			managers.map(async manager => {
				const upcomingBirthdays = await getUpcomingBirthdaysForManager(
					manager,
					nextMonday,
					nextSunday,
				)

				if (upcomingBirthdays.length > 0) {
					await sendBirthdayNotificationToManager(
						manager,
						upcomingBirthdays,
						nextMonday,
						nextSunday,
					)
				}
			}),
		)

		logger.info('Birthday notifications completed')
	} catch (error) {
		logger.error('Error during birthday notifications', { extra: { error } })
		throw error
	}
}

async function getTribeManagers(): Promise<ManagerWithEntity[]> {
	const managers = await prisma.user.findMany({
		where: {
			roles: { has: 'TRIBE_MANAGER' },
			isActive: true,
			tribeManager: { isNot: null },
		},
		select: {
			id: true,
			name: true,
			tribeManager: { select: { id: true, name: true } },
		},
	})

	return managers.map(m => ({
		id: m.id,
		name: m.name,
		entityType: 'TRIBE' as const,
		entityName: m.tribeManager!.name,
		entityId: m.tribeManager!.id,
	}))
}

async function getDepartmentManagers(): Promise<ManagerWithEntity[]> {
	const managers = await prisma.user.findMany({
		where: {
			roles: { has: 'DEPARTMENT_MANAGER' },
			isActive: true,
			managedDepartment: { isNot: null },
		},
		select: {
			id: true,
			name: true,
			managedDepartment: { select: { id: true, name: true } },
		},
	})

	return managers.map(m => ({
		id: m.id,
		name: m.name,
		entityType: 'DEPARTMENT' as const,
		entityName: m.managedDepartment!.name,
		entityId: m.managedDepartment!.id,
	}))
}

async function getHonorFamilyManagers(): Promise<ManagerWithEntity[]> {
	const managers = await prisma.user.findMany({
		where: {
			roles: { has: 'HONOR_FAMILY_MANAGER' },
			isActive: true,
			honorFamilyManager: { isNot: null },
		},
		select: {
			id: true,
			name: true,
			honorFamilyManager: { select: { id: true, name: true } },
		},
	})

	return managers.map(m => ({
		id: m.id,
		name: m.name,
		entityType: 'HONOR_FAMILY' as const,
		entityName: m.honorFamilyManager!.name,
		entityId: m.honorFamilyManager!.id,
	}))
}

async function getAllManagersWithEntities(): Promise<ManagerWithEntity[]> {
	const [tribeManagers, departmentManagers, honorFamilyManagers] =
		await Promise.all([
			getTribeManagers(),
			getDepartmentManagers(),
			getHonorFamilyManagers(),
		])

	return [...tribeManagers, ...departmentManagers, ...honorFamilyManagers]
}

async function fetchMembersForEntity(
	manager: ManagerWithEntity,
): Promise<any[]> {
	if (manager.entityType === 'TRIBE') {
		return prisma.user.findMany({
			where: {
				tribeId: manager.entityId,
				isActive: true,
				birthday: { not: null },
			},
			select: {
				id: true,
				name: true,
				birthday: true,
				tribe: { select: { name: true } },
			},
		})
	}

	if (manager.entityType === 'DEPARTMENT') {
		return prisma.user.findMany({
			where: {
				departmentId: manager.entityId,
				isActive: true,
				birthday: { not: null },
			},
			select: {
				id: true,
				name: true,
				birthday: true,
				department: { select: { name: true } },
			},
		})
	}

	return prisma.user.findMany({
		where: {
			honorFamilyId: manager.entityId,
			isActive: true,
			birthday: { not: null },
		},
		select: {
			id: true,
			name: true,
			birthday: true,
			honorFamily: { select: { name: true } },
		},
	})
}

function toBirthdayMember(
	member: any,
	manager: ManagerWithEntity,
): MemberWithBirthday {
	return {
		id: member.id,
		name: member.name,
		birthday: member.birthday,
		entityType: manager.entityType,
		entityName: manager.entityName,
		managerId: manager.id,
	}
}

function isBirthdayInWeek(
	birthday: Date,
	startDate: Date,
	endDate: Date,
): boolean {
	const birthdayThisYear = new Date(
		startDate.getFullYear(),
		birthday.getMonth(),
		birthday.getDate(),
	)

	return isWithinInterval(birthdayThisYear, { start: startDate, end: endDate })
}

async function getUpcomingBirthdaysForManager(
	manager: ManagerWithEntity,
	startDate: Date,
	endDate: Date,
): Promise<MemberWithBirthday[]> {
	const members = await fetchMembersForEntity(manager)

	return members
		.filter(m => m.birthday && isBirthdayInWeek(m.birthday, startDate, endDate))
		.map(m => toBirthdayMember(m, manager))
}

function buildBirthdayNotificationMessage(
	manager: ManagerWithEntity,
	birthdays: MemberWithBirthday[],
	startDate: Date,
	endDate: Date,
): { title: string; content: string } {
	const entityTypeMap = {
		TRIBE: 'tribu',
		DEPARTMENT: 'département',
		HONOR_FAMILY: "famille d'honneur",
	}
	const entityType = entityTypeMap[manager.entityType]
	const weekPeriod = `du ${format(startDate, 'dd/MM')} au ${format(endDate, 'dd/MM')}`

	if (birthdays.length === 1) {
		const birthdayDate = format(birthdays[0].birthday, 'dd MMMM', {
			locale: fr,
		})

		return {
			title: `Anniversaire à venir dans votre ${entityType}`,
			content: `${birthdays[0].name} fêtera son anniversaire le ${birthdayDate} (semaine ${weekPeriod}). N'oubliez pas de lui souhaiter !`,
		}
	}

	return {
		title: `${birthdays.length} anniversaires à venir dans votre ${entityType}`,
		content: `Anniversaires à venir dans votre ${entityType} "${manager.entityName}" (semaine ${weekPeriod})`,
	}
}

async function enqueueBirthdayNotification(
	manager: ManagerWithEntity,
	title: string,
	content: string,
) {
	await notificationQueue.add('birthday-notification', {
		inApp: { title, content, url: '/birthdays', userId: manager.id },
	})

	logger.info('Birthday notification sent to manager', {
		extra: { managerName: manager.name, entityName: manager.entityName },
	})
}

async function sendBirthdayNotificationToManager(
	manager: ManagerWithEntity,
	birthdays: MemberWithBirthday[],
	startDate: Date,
	endDate: Date,
) {
	const { title, content } = buildBirthdayNotificationMessage(
		manager,
		birthdays,
		startDate,
		endDate,
	)

	await enqueueBirthdayNotification(manager, title, content)
}

async function fetchMembersEligibleForBirthdaySms() {
	return prisma.user.findMany({
		where: {
			birthday: { not: null },
			church: { smsEnabled: true, isActive: true },
		},
		select: {
			id: true,
			name: true,
			birthday: true,
			phone: true,
			church: { select: { name: true } },
		},
	})
}

function isTodayBirthday(birthday: Date, today: Date): boolean {
	const memberBirthday = new Date(birthday)

	if (!isValid(memberBirthday)) return false

	return (
		getDate(memberBirthday) === getDate(today) &&
		getMonth(memberBirthday) === getMonth(today)
	)
}

async function queueBirthdaySms(member: { name: string; phone: string }) {
	await notificationQueue.add('birthday-sms', {
		sms: {
			phone: member.phone,
			content: `Joyeux anniversaire ${member.name} ! Votre communauté vous souhaite tout le meilleur. Que Dieu vous bénisse !`,
		},
	})

	logger.info('Birthday SMS queued for member', {
		extra: { memberName: member.name, phone: member.phone },
	})
}

export async function sendBirthdaySmsForMember() {
	const today = new Date()

	try {
		const members = await fetchMembersEligibleForBirthdaySms()
		const birthdayMembers = members.filter(
			m => m.birthday && isTodayBirthday(m.birthday, today),
		)

		await Promise.all(
			birthdayMembers
				.filter(m => m.phone)
				.map(m => queueBirthdaySms({ name: m.name, phone: m.phone! })),
		)

		logger.info('Birthday SMS task completed', {
			extra: { smsSent: birthdayMembers.length },
		})

		return { status: 'success', count: birthdayMembers.length }
	} catch (error) {
		logger.error('Error sending birthday SMS', { extra: { error } })
		throw error
	}
}
