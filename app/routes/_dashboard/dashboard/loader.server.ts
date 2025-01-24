import { json, type LoaderFunctionArgs } from '@remix-run/node'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { requireUser } from '~/utils/auth.server'
import { getMonthSundays } from '~/utils/date'
import { prisma } from '~/utils/db.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireUser(request)

	const { roles } = user

	const isChurchAdmin = roles.includes('ADMIN')

	if (!isChurchAdmin) {
		const tribeId = user.tribeId
		const departmentId = user.departmentId
		const honorFamilyId = user.honorFamilyId

		const [tribeMembers, departmentMembers, honorFamilyMembers] =
			await Promise.all([
				tribeId
					? ((await prisma.user.findMany({
							where: { tribe: { managerId: user.id } },
							select: {
								id: true,
								name: true,
								phone: true,
								location: true,
								createdAt: true,
							},
							orderBy: { createdAt: 'desc' },
						})) as Member[])
					: [],
				departmentId
					? ((await prisma.user.findMany({
							where: { department: { managerId: user.id } },
							select: {
								id: true,
								name: true,
								phone: true,
								location: true,
								createdAt: true,
							},
							orderBy: { createdAt: 'desc' },
						})) as Member[])
					: [],
				honorFamilyId
					? ((await prisma.user.findMany({
							where: { honorFamily: { managerId: user.id } },
							select: {
								id: true,
								name: true,
								phone: true,
								location: true,
								createdAt: true,
							},
							orderBy: { createdAt: 'desc' },
						})) as Member[])
					: [],
			])

		return json({
			isChurchAdmin,
			user,
			tribeMembers: getMembersAttendances(tribeMembers),
			departementMembers: getMembersAttendances(departmentMembers),
			honorFamilyMembers: getMembersAttendances(honorFamilyMembers),
		})
	}

	return json({ user, isChurchAdmin })
}

export type LoaderType = typeof loaderFn

function getMembersAttendances(members: Member[]): MemberMonthlyAttendances[] {
	const currentMonthSundays = getMonthSundays(new Date())
	return members.map(member => ({
		...member,
		previousMonthAttendanceResume: null,
		currentMonthAttendanceResume: null,
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			isPresent: null,
		})),
	}))
}
