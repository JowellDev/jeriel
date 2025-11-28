import { parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'

const schema = z.object({
	honorFamilyId: z
		.string()
		.optional()
		.transform(id => (id === '' ? undefined : id)),
})

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, { schema })

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission

	return prisma.user.findMany({
		where: {
			isActive: true,
			honorFamilyId: value.honorFamilyId,
			churchId: currentUser.churchId,
			NOT: { roles: { hasSome: ['HONOR_FAMILY_MANAGER'] } },
		},
		select: {
			id: true,
			name: true,
			email: true,
			isAdmin: true,
		},
		orderBy: { name: 'asc' },
	})
}

export type GetHonorFamilyAddableAssistantsLoaderData = typeof loader
