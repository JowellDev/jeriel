import { json, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { frenchAttendanceState, frenchMemberStatus } from '~/shared/constants'
import { type SelectOption } from '~/shared/types'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { churchId } = await requireUser(request)

	invariant(churchId, 'Church ID is required')

	const common = {
		where: { churchId },
		select: { id: true, name: true },
	}

	const [departments, honorFamilies, tribes] = await Promise.all([
		prisma.department.findMany(common),
		prisma.honorFamily.findMany(common),
		prisma.tribe.findMany(common),
	])

	return json({
		tribes: buildOptions(tribes),
		departments: buildOptions(departments),
		honorFamilies: buildOptions(honorFamilies),
		states: buildOptions(
			Object.entries(frenchAttendanceState).map(([key, value]) => ({
				id: key,
				name: value,
			})),
		),
		status: buildOptions(
			Object.entries(frenchMemberStatus).map(([key, value]) => ({
				id: key,
				name: value,
			})),
		),
	} as const)
}

function buildOptions(data: { id: string; name: string }[]): SelectOption[] {
	return data.map(data => ({ label: data.name, value: data.id }))
}

export type MemberFilterOptionsApiData = typeof loader
