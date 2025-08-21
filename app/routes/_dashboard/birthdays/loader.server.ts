import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseISO, startOfWeek, endOfWeek, format } from 'date-fns'
import type { BirthdayMember, BirthdayData } from './types'
import { requireUser } from '~/utils/auth.server'
import { getAllBirthdaysForWeek, getBirthdaysForManager } from './utils.server'

export async function loaderFn({ request }: LoaderFunctionArgs) {
	const user = await requireUser(request)

	const url = new URL(request.url)
	const weekParam = url.searchParams.get('week')

	let targetDate: Date
	if (weekParam) {
		targetDate = parseISO(weekParam)
	} else {
		targetDate = new Date()
	}

	const startDate = startOfWeek(targetDate, { weekStartsOn: 1 })
	const endDate = endOfWeek(targetDate, { weekStartsOn: 1 })

	const weekPeriod = `du ${format(startDate, 'dd MMM')} au ${format(endDate, 'dd MMM yyyy')}`

	const canSeeAll =
		user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')

	let birthdays: BirthdayMember[] = []
	let managedEntities: Array<{
		type: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
		id: string
		name: string
	}> = []

	if (canSeeAll) {
		birthdays = await getAllBirthdaysForWeek(
			startDate,
			endDate,
			user.churchId || '',
		)
	} else {
		const { birthdays: managerBirthdays, entities } =
			await getBirthdaysForManager(user.id, startDate, endDate)
		birthdays = managerBirthdays
		managedEntities = entities
	}

	return {
		weekPeriod,
		startDate: startDate.toISOString(),
		endDate: endDate.toISOString(),
		birthdays,
		totalCount: birthdays.length,
		userPermissions: {
			canSeeAll,
			managedEntities,
		},
	} satisfies BirthdayData
}

export type LoaderType = typeof loaderFn
