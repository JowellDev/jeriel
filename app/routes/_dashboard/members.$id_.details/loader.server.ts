import { Role } from '@prisma/client'
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { type MemberWithRelations } from '~/models/member.model'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	await requireUser(request)
	const { id } = params

	invariant(id, 'id must be defined')

	const member = (await prisma.user.findUnique({
		where: { id, roles: { hasSome: [Role.MEMBER, Role.ADMIN] } },
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
			tribe: {
				select: { name: true },
			},
			department: {
				select: { name: true },
			},
			honorFamily: {
				select: { name: true },
			},
		},
	})) as MemberWithRelations

	if (!member) return redirect('/members')

	return json({ member })
}
