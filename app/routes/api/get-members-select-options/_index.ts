import { type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
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

	return {
		tribes: buildOptions(tribes),
		departments: buildOptions(departments),
		honorFamilies: buildOptions(honorFamilies),
	} as const
}

function buildOptions(data: { id: string; name: string }[]): SelectOption[] {
	return data.map(data => ({ label: data.name, value: data.id }))
}

export type MemberFilterOptionsApiData = typeof loader
