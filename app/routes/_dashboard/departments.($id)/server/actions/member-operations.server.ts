import { type PrismaTx } from '~/infrastructures/database/prisma.server'
import { updateIntegrationDates } from '~/helpers/integration.server'
import { type MemberData } from '~/helpers/process-members-upload.server'

interface UpsertMembersArgs {
	tx: PrismaTx
	memberData: MemberData[]
	currentMemberIds: string[]
	departmentId: string
	churchId: string
}

export async function upsertMembers({
	tx,
	memberData,
	currentMemberIds,
	departmentId,
	churchId,
}: UpsertMembersArgs) {
	const newMemberIds: string[] = []

	for (const member of memberData) {
		// Chercher d'abord par ID (si existant), puis par email
		let user = member.id
			? await tx.user.findUnique({ where: { id: member.id } })
			: null

		if (!user && member.email) {
			user = await tx.user.findFirst({ where: { email: member.email } })
		}

		if (user) {
			await tx.user.update({
				where: { id: user.id },
				data: {
					name: member.name,
					phone: member.phone,
					location: member.location,
					department: { connect: { id: departmentId } },
				},
			})

			newMemberIds.push(user.id)
			continue
		}

		const newUser = await tx.user.create({
			data: {
				name: member.name,
				phone: member.phone,
				location: member.location,
				email: member.email,
				church: { connect: { id: churchId } },
				department: { connect: { id: departmentId } },
				roles: { set: ['MEMBER'] },
			},
		})

		newMemberIds.push(newUser.id)
	}

	await updateIntegrationDates({
		tx,
		entityType: 'department',
		newMemberIds,
		currentMemberIds,
	})
}

export async function handleRemovedMembers(
	tx: any,
	currentMembers: { id: string }[],
	newMemberData: MemberData[],
) {
	const newMemberIds = newMemberData.map(member => member.id).filter(Boolean)
	const removedMemberIds = currentMembers
		.map(member => member.id)
		.filter(id => !newMemberIds.includes(id))

	await tx.user.updateMany({
		where: { id: { in: removedMemberIds } },
		data: { departmentId: null },
	})
}
