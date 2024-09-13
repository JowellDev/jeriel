import { Role } from '@prisma/client'
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	await requireUser(request)
	const { id } = params

	invariant(id, 'id must be defined')

	const member = await prisma.user.findUnique({
		where: { id, roles: { hasSome: [Role.MEMBER] } },
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
		},
	})

	if (!member) return redirect('/members')

	return json({ member })
}
