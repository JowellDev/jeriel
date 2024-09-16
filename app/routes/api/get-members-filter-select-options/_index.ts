import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { frenchAttendanceState, frenchMemberStatus } from '~/shared/constants'
import { type SelectOption } from '~/shared/types'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await requireUser(request)

	const [departments, honorFamilies, tribes] = await Promise.all([
		prisma.department.findMany({ select: { id: true, name: true } }),
		prisma.honorFamily.findMany({ select: { id: true, name: true } }),
		prisma.tribe.findMany({ select: { id: true, name: true } }),
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
	return data.map(data => ({
		label: data.name,
		value: data.id,
	}))
}

export type MemberFilterOptionsApiData = typeof loader
