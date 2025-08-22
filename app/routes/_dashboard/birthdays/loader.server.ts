import { type LoaderFunctionArgs } from '@remix-run/node'
import type { BirthdayMember } from './types'
import { requireUser } from '~/utils/auth.server'
import { getAllBirthdaysForWeek, getBirthdaysForManager } from './utils.server'
import { parseWithZod } from '@conform-to/zod'
import { filterSchema } from './schema'
import invariant from 'tiny-invariant'

export async function loaderFn({ request }: LoaderFunctionArgs) {
	const user = await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'filter params must be defined')

	const { value } = submission

	const canSeeAll =
		user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')

	let birthdays: BirthdayMember[] = []
	let totalCount: number = 0
	let managedEntities: Array<{
		type: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
		id: string
		name: string
	}> = []

	if (canSeeAll) {
		const { birthdays: data, totalCount: total } = await getAllBirthdaysForWeek(
			value,
			user.churchId || '',
		)
		birthdays = data
		totalCount = total
	} else {
		const { birthdays: managerBirthdays, entities } =
			await getBirthdaysForManager(user.id, value)
		birthdays = managerBirthdays
		managedEntities = entities
	}

	return {
		filterData: value,
		birthdays,
		totalCount,
		userPermissions: {
			canSeeAll,
			managedEntities,
		},
	}
}

export type LoaderType = typeof loaderFn
