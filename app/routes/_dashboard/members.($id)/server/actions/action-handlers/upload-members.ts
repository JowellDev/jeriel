import { parseWithZod } from '@conform-to/zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { Role, type MaritalStatus } from '@prisma/client'
import { uploadMembersSchema } from '../../../schema'
import {
	type MemberData,
	processExcelFile,
} from '~/helpers/process-members-upload.server'
import {
	findOrCreateDepartments,
	findOrCreateHonorFamilies,
	findOrCreateTribes,
} from '../../../utils/entities'
import { appLogger } from '~/helpers/logging'

const logger = appLogger.child({ module: 'upload-members' })

export async function handleUploadMembers(
	formData: FormData,
	churchId: string,
) {
	const submission = parseWithZod(formData, { schema: uploadMembersSchema })

	if (submission.status !== 'success') return submission.reply()

	try {
		const { data: members, errors } = await processExcelFile(
			submission.value.file as File,
		)

		logger.info('Members extracted from file', {
			extra: { membersCount: members.length, errorsCount: errors.length },
		})

		if (errors.length) throw new Error('Données invalides', { cause: errors })

		await upsertMembers(members, churchId)

		return { status: 'success' }
	} catch (error: any) {
		logger.error('Error during member upload', {
			extra: { error, churchId },
		})
		return {
			...submission.reply(),
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

	logger.info('Starting member upsert', {
		extra: { totalMembers: members.length },
	})

	let created = 0
	let updated = 0
	let errors = 0

	for (const member of members) {
		try {
			const { birthday, tribe, department, honorFamily } = member

			const tribeId = tribe ? findEntityId(dbTribes, tribe) : null
			const dptId = department ? findEntityId(dbDepartements, department) : null
			const familyId = honorFamily
				? findEntityId(dbFamilies, honorFamily)
				: null

			const payload = {
				name: member.name,
				phone: member.phone,
				email: member.email,
				location: member.location,
				gender: member.gender,
				maritalStatus: member.maritalStatus as MaritalStatus | null,
				...(birthday && { birthday: new Date(birthday) }),
				...(tribeId && { tribe: { connect: { id: tribeId } } }),
				...(dptId && { department: { connect: { id: dptId } } }),
				...(familyId && { honorFamily: { connect: { id: familyId } } }),
			}

			const user = await prisma.user.findFirst({
				where: {
					name: { equals: member.name, mode: 'insensitive' },
				},
			})

			if (user) {
				await prisma.user.update({
					where: { id: user.id },
					data: payload,
				})

				updated++
				continue
			}

			await prisma.user.create({
				data: {
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

			created++
		} catch (error: any) {
			errors++
			logger.error('Failed to upsert member', {
				extra: {
					error,
					memberName: member.name,
					errorMessage: error.message,
				},
			})
		}
	}

	logger.info('Member upsert completed', {
		extra: { created, updated, errors },
	})
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
