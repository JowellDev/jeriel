import { parseWithZod } from '@conform-to/zod'
import { uploadMembersSchema } from '../schema'
import { type MemberData, processExcelFile } from '~/utils/process-member-model'
import { Role, type MaritalStatus } from '@prisma/client'
import {
	findOrCreateDepartments,
	findOrCreateHonorFamilies,
	findOrCreateTribes,
} from '../utils/entities'
import { prisma } from '~/utils/db.server'

export async function handleUploadMembers(
	formData: FormData,
	churchId: string,
) {
	const submission = parseWithZod(formData, { schema: uploadMembersSchema })

	if (submission.status !== 'success')
		return { lastResult: submission.reply(), success: false }

	try {
		const { data: members, errors } = await processExcelFile(
			submission.value.file as File,
		)

		if (errors.length) throw new Error('Données invalides', { cause: errors })

		await upsertMembers(members, churchId)

		return { success: true, lastResult: submission.reply() }
	} catch (error: any) {
		return {
			success: false,
			lastResult: submission.reply(),
			error: 'Fichier invalide ! Veuillez télécharger le modèle.',
		}
	}
}

async function upsertMembers(members: MemberData[], churchId: string) {
	const { tribes, departments, honorFamilies } = getMembersEntities(members)

	const [dbTribes, dbDepartements, dbFamilies] = await Promise.all([
		findOrCreateTribes(tribes, churchId),
		findOrCreateDepartments(departments, churchId),
		findOrCreateHonorFamilies(honorFamilies, churchId),
	])

	for (const member of members) {
		const { phone, birthday, tribe, department, honorFamily } = member

		const tribeId = tribe ? findEntityId(dbTribes, tribe) : null
		const dptId = department ? findEntityId(dbDepartements, department) : null
		const familyId = honorFamily ? findEntityId(dbFamilies, honorFamily) : null

		const payload = {
			name: member.name,
			location: member.location,
			gender: member.gender,
			maritalStatus: member.maritalStatus as MaritalStatus | null,
			...(birthday && { birthday: new Date(birthday) }),
			...(tribeId && { tribe: { connect: { id: tribeId } } }),
			...(dptId && { department: { connect: { id: dptId } } }),
			...(familyId && { honorFamily: { connect: { id: familyId } } }),
		}

		await prisma.user.upsert({
			where: { phone },
			update: payload,
			create: {
				phone,
				...payload,
				church: { connect: { id: churchId } },
				roles: { set: [Role.MEMBER] },
				integrationDate: {
					create: {
						tribeDate: tribeId ? new Date() : null,
						departementDate: dptId ? new Date() : null,
						familyDate: familyId ? new Date() : null,
					},
				},
			},
		})
	}
}

function getMembersEntities(members: MemberData[]) {
	const tribes = new Set<string>()
	const departments = new Set<string>()
	const honorFamilies = new Set<string>()

	for (const { tribe, department, honorFamily } of members) {
		tribe && tribes.add(tribe)
		department && departments.add(department)
		honorFamily && honorFamilies.add(honorFamily)
	}

	return {
		tribes: [...tribes],
		departments: [...departments],
		honorFamilies: [...honorFamilies],
	}
}

function findEntityId(items: { id: string; name: string }[], name: string) {
	return (
		items.find(
			item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
		)?.id ?? null
	)
}
