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

async function findExistingUser(tx: PrismaTx, member: MemberData) {
	if (member.id) return tx.user.findUnique({ where: { id: member.id } })
	if (member.email) return tx.user.findFirst({ where: { email: member.email } })
	return null
}

async function findOrUpsertMember(
	tx: PrismaTx,
	member: MemberData,
	departmentId: string,
	churchId: string,
): Promise<string> {
	const existing = await findExistingUser(tx, member)
	if (existing) {
		await tx.user.update({
			where: { id: existing.id },
			data: {
				name: member.name,
				phone: member.phone,
				location: member.location,
				department: { connect: { id: departmentId } },
			},
		})
		return existing.id
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

	return newUser.id
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
		newMemberIds.push(
			await findOrUpsertMember(tx, member, departmentId, churchId),
		)
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
