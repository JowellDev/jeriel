import { parseWithZod } from '@conform-to/zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { Role, type MaritalStatus } from '@prisma/client'
import { uploadMembersSchema } from '../../../schema'
import {
	type MemberData,
	processExcelFile,
} from '~/helpers/process-members-upload.server'
import { appLogger } from '~/helpers/logging'

const logger = appLogger.child({ module: 'upload-members' })

interface EntityIds {
	tribeId: string | null
	dptId: string | null
	familyId: string | null
}

interface EntityMaps {
	tribesMap: Map<string, string>
	dptMap: Map<string, string>
	familiesMap: Map<string, string>
}

type ExistingUser = {
	id: string
	name: string
	tribeId: string | null
	departmentId: string | null
	honorFamilyId: string | null
}

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

		if (errors.length)
			return { ...submission.reply(), error: errors.join('\n') }

		await upsertMembers(members, churchId)
		return { status: 'success' }
	} catch (error: any) {
		logger.error('Error during member upload', { extra: { error, churchId } })

		return {
			...submission.reply(),
			error: 'Fichier invalide ! Veuillez télécharger le modèle.',
		}
	}
}

function findMissingNames<T extends { name: string }>(
	existing: T[],
	names: string[],
): string[] {
	const existingNamesLower = new Set(existing.map(t => t.name.toLowerCase()))
	return names.filter(name => !existingNamesLower.has(name.toLowerCase()))
}

async function findOrCreateTribes(tribes: string[], churchId: string) {
	if (!tribes.length) return []

	const existing = await prisma.tribe.findMany({
		where: { name: { in: tribes } },
		select: { id: true, name: true },
	})

	const missing = findMissingNames(existing, tribes)

	const created = await Promise.all(
		missing.map(name =>
			prisma.tribe.create({
				data: { name, church: { connect: { id: churchId } } },
				select: { id: true, name: true },
			}),
		),
	)

	return [...existing, ...created]
}

async function findOrCreateDepartments(
	departments: string[],
	churchId: string,
) {
	if (!departments.length) return []

	const existing = await prisma.department.findMany({
		where: { name: { in: departments } },
		select: { id: true, name: true },
	})

	const missing = findMissingNames(existing, departments)

	const created = await Promise.all(
		missing.map(name =>
			prisma.department.create({
				data: { name, church: { connect: { id: churchId } } },
				select: { id: true, name: true },
			}),
		),
	)

	return [...existing, ...created]
}

async function findOrCreateHonorFamilies(families: string[], churchId: string) {
	if (!families.length) return []

	const existing = await prisma.honorFamily.findMany({
		where: { name: { in: families } },
		select: { id: true, name: true },
	})

	const missing = findMissingNames(existing, families)

	const created = await Promise.all(
		missing.map(name =>
			prisma.honorFamily.create({
				data: { name, location: 'N/D', church: { connect: { id: churchId } } },
				select: { id: true, name: true },
			}),
		),
	)

	return [...existing, ...created]
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

function resolveEntityIds(member: MemberData, maps: EntityMaps): EntityIds {
	return {
		tribeId: member.tribe
			? (maps.tribesMap.get(member.tribe.toLowerCase()) ?? null)
			: null,
		dptId: member.department
			? (maps.dptMap.get(member.department.toLowerCase()) ?? null)
			: null,
		familyId: member.honorFamily
			? (maps.familiesMap.get(member.honorFamily.toLowerCase()) ?? null)
			: null,
	}
}

function buildMemberUpsertPayload(
	member: MemberData,
	{ tribeId, dptId, familyId }: EntityIds,
) {
	return {
		name: member.name,
		phone: member.phone,
		email: member.email,
		location: member.location,
		gender: member.gender,
		maritalStatus: member.maritalStatus as MaritalStatus | null,
		...(member.birthday && { birthday: member.birthday }),
		...(tribeId && { tribe: { connect: { id: tribeId } } }),
		...(dptId && { department: { connect: { id: dptId } } }),
		...(familyId && { honorFamily: { connect: { id: familyId } } }),
	}
}

function buildIntegrationDateUpdate(
	{ tribeId, dptId, familyId }: EntityIds,
	user: ExistingUser,
) {
	const now = new Date()
	const fields: Record<string, Date | null> = {}
	if (tribeId && tribeId !== user.tribeId) fields.tribeDate = now
	if (dptId && dptId !== user.departmentId) fields.departementDate = now
	if (familyId && familyId !== user.honorFamilyId) fields.familyDate = now
	return fields
}

async function updateExistingMember(
	userId: string,
	payload: any,
	integrationFields: Record<string, Date | null>,
) {
	await prisma.user.update({
		where: { id: userId },
		data: {
			...payload,
			...(Object.keys(integrationFields).length > 0 && {
				integrationDate: {
					upsert: { create: integrationFields, update: integrationFields },
				},
			}),
		},
	})
}

async function createNewMember(
	payload: any,
	churchId: string,
	{ tribeId, dptId, familyId }: EntityIds,
) {
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
}

async function upsertSingleMember(
	member: MemberData,
	existingByName: Map<string, ExistingUser>,
	maps: EntityMaps,
	churchId: string,
): Promise<'created' | 'updated'> {
	const entityIds = resolveEntityIds(member, maps)
	const payload = buildMemberUpsertPayload(member, entityIds)
	const existing = existingByName.get(member.name.toLowerCase())

	if (existing) {
		const integrationFields = buildIntegrationDateUpdate(entityIds, existing)
		await updateExistingMember(existing.id, payload, integrationFields)
		return 'updated'
	}

	await createNewMember(payload, churchId, entityIds)
	return 'created'
}

async function fetchExistingMembersByName(
	members: MemberData[],
	churchId: string,
): Promise<Map<string, ExistingUser>> {
	const memberNames = members.map(m => m.name)
	const users = await prisma.user.findMany({
		where: { churchId, name: { in: memberNames } },
		select: {
			id: true,
			name: true,
			tribeId: true,
			departmentId: true,
			honorFamilyId: true,
		},
	})

	return new Map(users.map(u => [u.name.toLowerCase(), u]))
}

async function processMembers(
	members: MemberData[],
	existingByName: Map<string, ExistingUser>,
	maps: EntityMaps,
	churchId: string,
) {
	let created = 0,
		updated = 0,
		errors = 0

	for (const member of members) {
		try {
			const result = await upsertSingleMember(
				member,
				existingByName,
				maps,
				churchId,
			)
			result === 'created' ? created++ : updated++
		} catch (error: any) {
			errors++
			logger.error('Failed to upsert member', {
				extra: { error, memberName: member.name, errorMessage: error.message },
			})
		}
	}

	return { created, updated, errors }
}

async function upsertMembers(members: MemberData[], churchId: string) {
	if (!members.length) return

	const { tribes, departments, honorFamilies } = getMembersEntities(members)

	const [dbTribes, dbDepartements, dbFamilies] = await Promise.all([
		findOrCreateTribes(tribes, churchId),
		findOrCreateDepartments(departments, churchId),
		findOrCreateHonorFamilies(honorFamilies, churchId),
	])

	const maps: EntityMaps = {
		tribesMap: new Map(dbTribes.map(t => [t.name.toLowerCase(), t.id])),
		dptMap: new Map(dbDepartements.map(d => [d.name.toLowerCase(), d.id])),
		familiesMap: new Map(dbFamilies.map(f => [f.name.toLowerCase(), f.id])),
	}

	const existingByName = await fetchExistingMembersByName(members, churchId)

	logger.info('Starting member upsert', {
		extra: { totalMembers: members.length },
	})

	const { created, updated, errors } = await processMembers(
		members,
		existingByName,
		maps,
		churchId,
	)

	logger.info('Member upsert completed', {
		extra: { created, updated, errors },
	})
}
