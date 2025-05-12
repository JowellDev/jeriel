import { Role } from '@prisma/client'
import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	await requireUser(request)
	const { id } = params

	invariant(id, 'id must be defined')

	const member = await prisma.user.findUnique({
		where: { id, roles: { hasSome: [Role.MEMBER, Role.ADMIN] } },
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
			birthday: true,
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

	if (!member) return redirect('/members')

	return { member }
}
