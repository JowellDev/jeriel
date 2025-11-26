import { parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

const schema = z.object({
	tribeId: z
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
			tribeId: value.tribeId,
			churchId: currentUser.churchId,
			NOT: { roles: { hasSome: ['TRIBE_MANAGER'] } },
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

export type GetTribeAddableAssistantsLoaderData = typeof loader
