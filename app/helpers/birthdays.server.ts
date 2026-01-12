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

		for (const manager of managers) {
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
		}

		logger.info('Birthday notifications completed')
	} catch (error) {
		logger.error('Error during birthday notifications', {
			extra: { error },
		})
		throw error
	}
}

async function getAllManagersWithEntities(): Promise<ManagerWithEntity[]> {
	const managers: ManagerWithEntity[] = []

	const tribeManagers = await prisma.user.findMany({
		where: {
			roles: { has: 'TRIBE_MANAGER' },
			isActive: true,
			tribeManager: {
				isNot: null,
			},
		},
		select: {
			id: true,
			name: true,
			tribeManager: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	})

	managers.push(
		...tribeManagers.map(manager => ({
			id: manager.id,
			name: manager.name,
			entityType: 'TRIBE' as const,
			entityName: manager.tribeManager!.name,
			entityId: manager.tribeManager!.id,
		})),
	)

	const departmentManagers = await prisma.user.findMany({
		where: {
			roles: { has: 'DEPARTMENT_MANAGER' },
			isActive: true,
			managedDepartment: {
				isNot: null,
			},
		},
		select: {
			id: true,
			name: true,
			managedDepartment: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	})

	managers.push(
		...departmentManagers.map(manager => ({
			id: manager.id,
			name: manager.name,
			entityType: 'DEPARTMENT' as const,
			entityName: manager.managedDepartment!.name,
			entityId: manager.managedDepartment!.id,
		})),
	)

	const honorFamilyManagers = await prisma.user.findMany({
		where: {
			roles: { has: 'HONOR_FAMILY_MANAGER' },
			isActive: true,
			honorFamilyManager: {
				isNot: null,
			},
		},
		select: {
			id: true,
			name: true,
			honorFamilyManager: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	})

	managers.push(
		...honorFamilyManagers.map(manager => ({
			id: manager.id,
			name: manager.name,
			entityType: 'HONOR_FAMILY' as const,
			entityName: manager.honorFamilyManager!.name,
			entityId: manager.honorFamilyManager!.id,
		})),
	)

	return managers
}

async function getUpcomingBirthdaysForManager(
	manager: ManagerWithEntity,
	startDate: Date,
	endDate: Date,
): Promise<MemberWithBirthday[]> {
	let members: any[] = []

	switch (manager.entityType) {
		case 'TRIBE':
			members = await prisma.user.findMany({
				where: {
					tribeId: manager.entityId,
					isActive: true,
					birthday: { not: null },
				},
				select: {
					id: true,
					name: true,
					birthday: true,
					tribe: {
						select: { name: true },
					},
				},
			})
			break

		case 'DEPARTMENT':
			members = await prisma.user.findMany({
				where: {
					departmentId: manager.entityId,
					isActive: true,
					birthday: { not: null },
				},
				select: {
					id: true,
					name: true,
					birthday: true,
					department: {
						select: { name: true },
					},
				},
			})
			break

		case 'HONOR_FAMILY':
			members = await prisma.user.findMany({
				where: {
					honorFamilyId: manager.entityId,
					isActive: true,
					birthday: { not: null },
				},
				select: {
					id: true,
					name: true,
					birthday: true,
					honorFamily: {
						select: { name: true },
					},
				},
			})
			break
	}

	return members
		.filter(
			member =>
				member.birthday &&
				isBirthdayInWeek(member.birthday, startDate, endDate),
		)
		.map(member => ({
			id: member.id,
			name: member.name,
			birthday: member.birthday,
			entityType: manager.entityType,
			entityName: manager.entityName,
			managerId: manager.id,
		}))
}

function isBirthdayInWeek(
	birthday: Date,
	startDate: Date,
	endDate: Date,
): boolean {
	const currentYear = startDate.getFullYear()

	const birthdayThisYear = new Date(
		currentYear,
		birthday.getMonth(),
		birthday.getDate(),
	)

	return isWithinInterval(birthdayThisYear, { start: startDate, end: endDate })
}

async function sendBirthdayNotificationToManager(
	manager: ManagerWithEntity,
	birthdays: MemberWithBirthday[],
	startDate: Date,
	endDate: Date,
) {
	const entityTypeMap = {
		TRIBE: 'tribu',
		DEPARTMENT: 'département',
		HONOR_FAMILY: "famille d'honneur",
	}

	const entityType = entityTypeMap[manager.entityType]
	const weekPeriod = `du ${format(startDate, 'dd/MM')} au ${format(endDate, 'dd/MM')}`

	let title: string
	let content: string

	if (birthdays.length === 1) {
		const member = birthdays[0]
		const birthdayDate = format(member.birthday, 'dd MMMM', { locale: fr })
		title = `Anniversaire à venir dans votre ${entityType}`
		content = `${member.name} fêtera son anniversaire le ${birthdayDate} (semaine ${weekPeriod}). N'oubliez pas de lui souhaiter !`
	} else {
		title = `${birthdays.length} anniversaires à venir dans votre ${entityType}`
		content = `Anniversaires à venir dans votre ${entityType} "${manager.entityName}" (semaine ${weekPeriod})`
	}

	await notificationQueue.add('birthday-notification', {
		inApp: {
			title,
			content,
			url: '/birthdays',
			userId: manager.id,
		},
	})

	logger.info('Birthday notification sent to manager', {
		extra: {
			managerName: manager.name,
			birthdaysCount: birthdays.length,
			entityName: manager.entityName,
		},
	})
}

export async function sendBirthdaySmsForMember() {
	const today = new Date()

	try {
		const members = await prisma.user.findMany({
			where: {
				birthday: {
					not: null,
				},
				church: {
					smsEnabled: true,
					isActive: true,
				},
			},
			select: {
				id: true,
				name: true,
				birthday: true,
				phone: true,
				church: {
					select: {
						name: true,
					},
				},
			},
		})

		const birthdayMembers = members.filter(member => {
			if (!member.birthday) return false

			const memberBirthday = new Date(member.birthday)

			if (!isValid(memberBirthday)) return false

			return (
				getDate(memberBirthday) === getDate(today) &&
				getMonth(memberBirthday) === getMonth(today)
			)
		})

		for (const member of birthdayMembers) {
			const phoneNumber = member.phone
			if (!phoneNumber) continue

			await notificationQueue.add('birthday-sms', {
				sms: {
					phone: phoneNumber,
					content: `Joyeux anniversaire ${member.name} ! Votre communauté vous souhaite tout le meilleur. Que Dieu vous bénisse !`,
				},
			})

			logger.info('Birthday SMS queued for member', {
				extra: { memberName: member.name, phone: phoneNumber },
			})
		}

		logger.info('Birthday SMS task completed', {
			extra: { smsSent: birthdayMembers.length },
		})
		return { status: 'success', count: birthdayMembers.length }
	} catch (error) {
		logger.error('Error sending birthday SMS', {
			extra: { error },
		})

		throw error
	}
}
