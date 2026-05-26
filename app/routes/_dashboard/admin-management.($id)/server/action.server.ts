import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { type AuthenticatedUser, requireRole } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { PWD_ERROR_MESSAGE, PWD_REGEX } from '~/shared/constants'
import { hashPassword } from '~/helpers/integration.server'
import {
	addAdminSchema,
	filterSchema,
	removeAdminSchema,
	resetPasswordSchema,
} from '../schema'
import { FORM_INTENT } from '../constants'
import { createFile } from '~/utils/xlsx.server'

async function fetchUserForValidation(
	userId: string,
	churchId: string,
	ctx: z.RefinementCtx,
) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			churchId: true,
			email: true,
			roles: true,
			password: { select: { hash: true } },
		},
	})

	if (!user) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['userId'],
			message: 'Utilisateur introuvable',
		})

		return null
	}

	if (user.churchId !== churchId) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['userId'],
			message: "Cet utilisateur n'appartient pas à votre église",
		})

		return null
	}

	if (user.roles.includes(Role.ADMIN)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['userId'],
			message: 'Cet utilisateur est déjà administrateur',
		})

		return null
	}

	return user
}

async function validateAdminEmail(
	hasEmail: boolean,
	email: string | undefined,
	userId: string,
	ctx: z.RefinementCtx,
) {
	if (!hasEmail && !email) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['email'],
			message: "L'adresse email est requise pour ce fidèle",
		})

		return false
	}

	if (email) {
		const existing = await prisma.user.findFirst({
			where: { email, id: { not: userId } },
		})

		if (existing) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['email'],
				message: 'Cette adresse email est déjà utilisée',
			})

			return false
		}
	}

	return true
}

function validateAdminPassword(
	hasPassword: boolean,
	password: string | undefined,
	ctx: z.RefinementCtx,
) {
	if (!hasPassword && !password) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['password'],
			message: 'Le mot de passe est requis pour ce fidèle',
		})
		return
	}

	if (password) {
		if (password.length < 8)
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['password'],
				message: PWD_ERROR_MESSAGE.min,
			})

		if (!password.match(PWD_REGEX))
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['password'],
				message: PWD_ERROR_MESSAGE.invalid,
			})
	}
}

const superRefineAddAdminHandler = async (
	data: z.infer<typeof addAdminSchema>,
	ctx: z.RefinementCtx,
	churchId: string,
) => {
	const user = await fetchUserForValidation(data.userId, churchId, ctx)

	if (!user) return

	const emailOk = await validateAdminEmail(
		!!user.email,
		data.email,
		data.userId,
		ctx,
	)

	if (!emailOk) return

	validateAdminPassword(!!user.password, data.password, ctx)
}

async function fetchUserForAdminPromotion(
	tx: any,
	userId: string,
	churchId: string,
) {
	const user = await tx.user.findUnique({
		where: { id: userId },
		select: {
			roles: true,
			isAdmin: true,
			churchId: true,
			email: true,
			password: { select: { hash: true } },
		},
	})

	invariant(user, 'Utilisateur introuvable')
	invariant(user.churchId === churchId, 'Utilisateur non autorisé')
	invariant(
		!user.roles.includes(Role.ADMIN),
		'Cet utilisateur est déjà administrateur',
	)

	return user
}

async function buildAdminPromotionData(
	user: {
		roles: Role[]
		email: string | null
		password: { hash: string } | null
	},
	email: string | undefined,
	password: string | undefined,
): Promise<Prisma.UserUpdateInput> {
	const updatedRoles = user.roles.includes(Role.ADMIN)
		? user.roles
		: [...user.roles, Role.ADMIN]

	const updateData: Prisma.UserUpdateInput = {
		roles: updatedRoles,
		isAdmin: true,
	}

	if (email) updateData.email = email

	if (!user.password && password) {
		updateData.password = { create: { hash: await hashPassword(password) } }
	}

	return updateData
}

async function addAdmin(
	userId: string,
	email: string | undefined,
	password: string | undefined,
	churchId: string,
) {
	return prisma.$transaction(async tx => {
		const user = await fetchUserForAdminPromotion(tx, userId, churchId)

		if (!user.email && !email) throw new Error("L'adresse email est requise")
		if (!user.password && !password)
			throw new Error('Le mot de passe est requis')

		const updateData = await buildAdminPromotionData(user, email, password)

		await tx.user.update({ where: { id: userId }, data: updateData })
	})
}

async function fetchUserForAdminRemoval(
	tx: any,
	userId: string,
	churchId: string,
) {
	const user = await tx.user.findUnique({
		where: { id: userId },
		select: {
			roles: true,
			churchId: true,
			password: { select: { hash: true } },
			churchAdmin: { select: { id: true } },
		},
	})

	invariant(user, 'Utilisateur introuvable')
	invariant(user.churchId === churchId, 'Utilisateur non autorisé')
	invariant(
		user.roles.includes(Role.ADMIN),
		"Cet utilisateur n'est pas administrateur",
	)

	return user
}

function buildAdminRemovalData(user: {
	roles: Role[]
	password: { hash: string } | null
}): Prisma.UserUpdateInput {
	const updatedRoles = user.roles.filter(role => role !== Role.ADMIN)
	const hasOtherManagerialRoles = updatedRoles.some(role =>
		[
			Role.TRIBE_MANAGER,
			Role.DEPARTMENT_MANAGER,
			Role.HONOR_FAMILY_MANAGER,
		].includes(role),
	)

	const updateData: Prisma.UserUpdateInput = { roles: updatedRoles }

	if (!hasOtherManagerialRoles) {
		updateData.isAdmin = false
		if (user.password) updateData.password = { delete: true }
	}

	return updateData
}

async function removeAdmin(
	userId: string,
	currentUserId: string,
	churchId: string,
) {
	if (userId === currentUserId) {
		return {
			status: 'error',
			message: "Vous ne pouvez pas retirer votre propre rôle d'administrateur",
		}
	}
	return prisma.$transaction(async tx => {
		const user = await fetchUserForAdminRemoval(tx, userId, churchId)
		if (user.churchAdmin) {
			return {
				status: 'error',
				message:
					"Impossible de retirer le rôle administrateur au manager principal de l'église",
			}
		}

		await tx.user.update({
			where: { id: userId },
			data: buildAdminRemovalData(user),
		})

		return { status: 'success' }
	})
}

async function fetchUserForPasswordReset(
	tx: any,
	userId: string,
	churchId: string,
) {
	const user = await tx.user.findUnique({
		where: { id: userId },
		select: {
			roles: true,
			churchId: true,
			password: { select: { hash: true } },
		},
	})

	invariant(user, 'Utilisateur introuvable')
	invariant(user.churchId === churchId, 'Utilisateur non autorisé')
	invariant(
		user.roles.includes(Role.ADMIN),
		"Cet utilisateur n'est pas administrateur",
	)

	return user
}

async function upsertUserPassword(
	tx: any,
	userId: string,
	hashedPassword: string,
	hasExisting: boolean,
) {
	if (hasExisting) {
		await tx.password.update({
			where: { userId },
			data: { hash: hashedPassword },
		})
	} else {
		await tx.password.create({ data: { userId, hash: hashedPassword } })
	}
}

async function resetPassword(
	userId: string,
	password: string,
	currentUserId: string,
	churchId: string,
) {
	if (userId === currentUserId) {
		return {
			status: 'error',
			message: 'Vous ne pouvez pas réinitialiser votre propre mot de passe',
		}
	}

	return prisma.$transaction(async tx => {
		const user = await fetchUserForPasswordReset(tx, userId, churchId)
		const hashedPassword = await hashPassword(password)
		await upsertUserPassword(tx, userId, hashedPassword, !!user.password)
		return { status: 'success' }
	})
}

function buildAdminExportWhere(
	churchId: string,
	query: string,
	status: string | undefined,
) {
	return {
		churchId,
		roles: { has: Role.ADMIN },
		...(query && {
			OR: [
				{ name: { contains: query, mode: 'insensitive' as const } },
				{ email: { contains: query, mode: 'insensitive' as const } },
				{ phone: { contains: query } },
			],
		}),
		...(status === 'active' && { isActive: true }),
		...(status === 'inactive' && { isActive: false }),
	}
}

function formatAdminExportRow(admin: any) {
	const additionalRoles = admin.roles
		.filter((r: Role) => r !== Role.ADMIN)
		.join(', ')

	const managedEntities = [
		admin.tribe?.name,
		admin.department?.name,
		admin.honorFamily?.name,
	]
		.filter(Boolean)
		.join(', ')

	return {
		'Nom & Prénoms': admin.name,
		Email: admin.email || 'N/D',
		Téléphone: admin.phone || 'N/D',
		Localisation: admin.location || 'N/D',
		Statut: admin.isActive ? 'Actif' : 'Inactif',
		'Rôles additionnels': additionalRoles || 'Aucun',
		'Entités gérées': managedEntities || 'Aucune',
		'Date de création': admin.createdAt.toLocaleDateString('fr-FR'),
	}
}

async function fetchAdminsForExport(where: any) {
	return prisma.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			location: true,
			isActive: true,
			roles: true,
			createdAt: true,
			tribe: { select: { name: true } },
			department: { select: { name: true } },
			honorFamily: { select: { name: true } },
		},
		orderBy: { createdAt: 'desc' },
	})
}

async function exportAdmins(request: Request, currentUser: AuthenticatedUser) {
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { query, status } = submission.value

	const where = buildAdminExportWhere(currentUser.churchId!, query, status)

	const admins = await fetchAdminsForExport(where)

	const fileLink = await createFile({
		safeRows: admins.map(formatAdminExportRow),
		feature: 'Administrateurs',
		customerName: currentUser.name,
	})

	return { status: 'success', fileLink }
}

function handleActionError(submission: any, result: any) {
	if (result?.status === 'error') {
		return submission.reply({
			formErrors: [result.message ?? 'Une erreur est survenue'],
		})
	}

	return result || { status: 'success' }
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireRole(request, [Role.ADMIN])
	const formData = await request.formData()
	const intent = formData.get('intent') as string

	invariant(currentUser.churchId, 'Invalid churchId')

	if (intent === FORM_INTENT.EXPORT) return exportAdmins(request, currentUser)

	if (intent === FORM_INTENT.REMOVE_ADMIN) {
		const submission = await parseWithZod(formData, {
			schema: removeAdminSchema,
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()
		const result = await removeAdmin(
			submission.value.userId,
			currentUser.id,
			currentUser.churchId,
		)

		return handleActionError(submission, result)
	}

	if (intent === FORM_INTENT.ADD_ADMIN) {
		const submission = await parseWithZod(formData, {
			schema: addAdminSchema.superRefine((fields, ctx) =>
				superRefineAddAdminHandler(fields, ctx, currentUser.churchId as string),
			),
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		await addAdmin(
			submission.value.userId,
			submission.value.email || undefined,
			submission.value.password || undefined,
			currentUser.churchId,
		)

		return { status: 'success' }
	}

	if (intent === FORM_INTENT.RESET_PASSWORD) {
		const submission = await parseWithZod(formData, {
			schema: resetPasswordSchema,
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()
		const result = await resetPassword(
			submission.value.userId,
			submission.value.password,
			currentUser.id,
			currentUser.churchId,
		)

		return handleActionError(submission, result)
	}

	return { status: 'error', message: 'Intent non reconnu' }
}

export type ActionType = typeof actionFn
