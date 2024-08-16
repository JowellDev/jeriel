import { type User } from '@prisma/client'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const user = (await prisma.user.findUnique({
		where: { id: currentUser.id },
	})) as User

	return json({ user })
}

export type LoaderType = typeof loaderFn
