import { type ActionFunctionArgs, redirect } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { FORM_INTENT } from './constants'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	await requireUser(request)

	const { id } = params
	invariant(id, 'id must be defined')

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === FORM_INTENT.DELETE_MEMBER) return deleteMember(id)

	return { success: false }
}

async function deleteMember(memberId: string) {
	const member = await prisma.user.findUnique({
		where: { id: memberId },
		select: {
			id: true,
			tribeManager: { select: { id: true } },
			managedDepartment: { select: { id: true } },
			honorFamilyManager: { select: { id: true } },
		},
	})

	if (!member) {
		return { success: false, error: 'Membre non trouvé' }
	}

	const isManager =
		member.tribeManager || member.managedDepartment || member.honorFamilyManager

	if (isManager) {
		return {
			success: false,
			error:
				"Ce membre est responsable d'une entité et ne peut pas être supprimé.",
		}
	}

	await prisma.$transaction(async tx => {
		await tx.attendance.deleteMany({
			where: { memberId },
		})

		await tx.notification.deleteMany({
			where: { userId: memberId },
		})

		await tx.reportTracking.deleteMany({
			where: { submitterId: memberId },
		})

		await tx.attendanceReport.deleteMany({
			where: { submitterId: memberId },
		})

		const archiveRequestsAsRequester = await tx.archiveRequest.findMany({
			where: { requesterId: memberId },
			select: { id: true },
		})

		if (archiveRequestsAsRequester.length > 0) {
			await tx.archiveRequest.deleteMany({
				where: { requesterId: memberId },
			})
		}

		await tx.user.update({
			where: { id: memberId },
			data: {
				archiveRequestsReceived: {
					set: [],
				},
			},
		})

		await tx.user.delete({
			where: { id: memberId },
		})
	})

	return redirect('/members')
}

export async function checkIfMemberIsManager(memberId: string) {
	const member = await prisma.user.findUnique({
		where: { id: memberId },
		select: {
			tribeManager: { select: { id: true, name: true } },
			managedDepartment: { select: { id: true, name: true } },
			honorFamilyManager: { select: { id: true, name: true } },
		},
	})

	if (!member) return { isManager: false, entities: [] }

	const entities: { type: string; name: string }[] = []

	if (member.tribeManager) {
		entities.push({ type: 'tribu', name: member.tribeManager.name })
	}
	if (member.managedDepartment) {
		entities.push({ type: 'département', name: member.managedDepartment.name })
	}
	if (member.honorFamilyManager) {
		entities.push({
			type: "famille d'honneur",
			name: member.honorFamilyManager.name,
		})
	}

	return {
		isManager: entities.length > 0,
		entities,
	}
}
