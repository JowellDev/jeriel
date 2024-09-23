import { type PrismaTx } from '~/utils/db.server'
import { type MemberData } from '~/utils/process-member-model'

interface UpsertMembersArgs {
	tx: PrismaTx
	memberData: MemberData[]
	departmentId: string
	churchId: string
}

export async function upsertMembers({
	tx,
	memberData,
	departmentId,
	churchId,
}: UpsertMembersArgs) {
	for (const member of memberData) {
		await tx.user.upsert({
			where: { phone: member.phone },
			create: {
				name: member.name,
				phone: member.phone,
				location: member.location,
				church: { connect: { id: churchId } },
				department: { connect: { id: departmentId } },
				roles: { set: ['MEMBER'] },
			},
			update: {
				name: member.name,
				location: member.location,
				department: { connect: { id: departmentId } },
			},
		})
	}
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
