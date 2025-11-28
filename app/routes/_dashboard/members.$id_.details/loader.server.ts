import { Role } from '@prisma/client'
import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	await requireUser(request)

	const { id } = params
	invariant(id, 'id must be defined')

	const member = await getMember(id)

	if (!member) return redirect('/members')

	return { member }
}

function getMember(id: string) {
	return prisma.user.findUnique({
		where: { id, roles: { hasSome: [Role.MEMBER, Role.ADMIN] } },
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			pictureUrl: true,
			location: true,
			createdAt: true,
			birthday: true,
			gender: true,
			maritalStatus: true,
			integrationDate: true,
			attendances: {
				select: {
					date: true,
					inChurch: true,
					inService: true,
					inMeeting: true,
					report: {
						select: {
							entity: true,
						},
					},
				},
				orderBy: {
					date: 'asc',
				},
			},
			tribe: {
				select: { id: true, name: true },
			},
			department: {
				select: { id: true, name: true },
			},
			honorFamily: {
				select: { id: true, name: true },
			},
		},
	})
}
