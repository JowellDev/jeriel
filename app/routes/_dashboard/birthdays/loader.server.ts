import { type LoaderFunctionArgs } from '@remix-run/node'
import type { BirthdayMember } from './types'
import { requireUser } from '~/utils/auth.server'
import { getAllBirthdays, getEntitiesBirthdays } from './utils.server'
import { parseWithZod } from '@conform-to/zod'
import { filterSchema } from './schema'
import invariant from 'tiny-invariant'
import { endOfWeek, startOfWeek } from 'date-fns'
import type { z } from 'zod'

type FilterValue = z.infer<typeof filterSchema>
type ManagedEntity = {
	type: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
	id: string
	name: string
}

function isAdminUser(roles: string[]) {
	return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')
}

async function fetchBirthdayData(
	userId: string,
	churchId: string,
	filterValue: FilterValue,
	canSeeAll: boolean,
) {
	if (canSeeAll) {
		const { birthdays, totalCount } = await getAllBirthdays(
			filterValue,
			churchId,
		)
		return { birthdays, totalCount, managedEntities: [] as ManagedEntity[] }
	}
	const {
		birthdays,
		entities: managedEntities,
		totalCount,
	} = await getEntitiesBirthdays(userId, filterValue)
	return { birthdays, totalCount, managedEntities }
}

export async function loaderFn({ request }: LoaderFunctionArgs) {
	const user = await requireUser(request)
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})
	invariant(submission.status === 'success', 'filter params must be defined')
	const { value } = submission
	if (value.tab === 'week') {
		value.from = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
		value.to = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
	}
	const canSeeAll = isAdminUser(user.roles)
	const { birthdays, totalCount, managedEntities } = await fetchBirthdayData(
		user.id,
		user.churchId || '',
		value,
		canSeeAll,
	)
	return {
		filterData: { ...value },
		birthdays,
		totalCount,
		userPermissions: { canSeeAll, managedEntities },
	}
}

export type LoaderType = typeof loaderFn
