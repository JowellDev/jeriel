import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { hash } from '@node-rs/argon2'
import { z } from 'zod'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { type AuthenticatedUser, requireRole } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { PWD_ERROR_MESSAGE, PWD_REGEX } from '~/shared/constants'
import { addAdminSchema, filterSchema, removeAdminSchema } from '../schema'
import { FORM_INTENT } from '../constants'
import { createFile } from '~/utils/xlsx.server'

const superRefineAddAdminHandler = async (
	data: z.infer<typeof addAdminSchema>,
	ctx: z.RefinementCtx,
	churchId: string,
) => {
	const { userId, password, email } = data

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
		return
	}

	if (user.churchId !== churchId) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['userId'],
			message: "Cet utilisateur n'appartient pas à votre église",
		})
		return
	}

	if (user.roles.includes(Role.ADMIN)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['userId'],
			message: 'Cet utilisateur est déjà administrateur',
		})
		return
	}

	const hasEmail = !!user.email
	const hasPassword = !!user.password

	if (!hasEmail && !email) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['email'],
			message: "L'adresse email est requise pour ce fidèle",
		})
		return
	}

	if (email) {
		const existingUser = await prisma.user.findFirst({
			where: { email, id: { not: userId } },
		})

		if (existingUser) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['email'],
				message: 'Cette adresse email est déjà utilisée',
			})
			return
		}
	}

	if (!hasPassword && !password) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['password'],
			message: 'Le mot de passe est requis pour ce fidèle',
		})
		return
	}

	if (password) {
		if (password.length < 8) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['password'],
				message: PWD_ERROR_MESSAGE.min,
			})
		}

		if (!password.match(PWD_REGEX)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['password'],
				message: PWD_ERROR_MESSAGE.invalid,
			})
		}
	}
}

async function hashPassword(password: string) {
	const { ARGON_SECRET_KEY } = process.env
	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY must be set')

	return await hash(password, {
		secret: Buffer.from(ARGON_SECRET_KEY),
	})
}

async function addAdmin(
	userId: string,
	email: string | undefined,
	password: string | undefined,
	churchId: string,
) {
	return await prisma.$transaction(async tx => {
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

		const hasEmail = !!user.email
		const hasPassword = !!user.password

		if (!hasEmail && !email) {
			throw new Error("L'adresse email est requise")
		}

		if (!hasPassword && !password) {
			throw new Error('Le mot de passe est requis')
		}

		const updatedRoles = [...user.roles]
		if (!updatedRoles.includes(Role.ADMIN)) {
			updatedRoles.push(Role.ADMIN)
		}

		const updateData: Prisma.UserUpdateInput = {
			roles: updatedRoles,
			isAdmin: true,
		}

		if (email) {
			updateData.email = email
		}

		if (!hasPassword && password) {
			const hashedPassword = await hashPassword(password)
			updateData.password = { create: { hash: hashedPassword } }
		}

		await tx.user.update({
			where: { id: userId },
			data: updateData,
		})
	})
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

	return await prisma.$transaction(async tx => {
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

		if (user.churchAdmin) {
			return {
				status: 'error',
				message:
					"Impossible de retirer le rôle administrateur au manager principal de l'église",
			}
		}

		const updatedRoles = user.roles.filter(role => role !== Role.ADMIN)

		const hasOtherManagerialRoles = updatedRoles.some(role =>
			[
				Role.TRIBE_MANAGER,
				Role.DEPARTMENT_MANAGER,
				Role.HONOR_FAMILY_MANAGER,
			].includes(role),
		)

		const updateData: Prisma.UserUpdateInput = {
			roles: updatedRoles,
		}

		if (!hasOtherManagerialRoles) {
			updateData.isAdmin = false
			if (user.password) {
				updateData.password = { delete: true }
			}
		}

		await tx.user.update({
			where: { id: userId },
			data: updateData,
		})

		return { status: 'success' }
	})
}

async function exportAdmins(request: Request, currentUser: AuthenticatedUser) {
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { query, status } = submission.value

	const where = {
		churchId: currentUser.churchId,
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

	const admins = await prisma.user.findMany({
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

	const safeRows = admins.map(admin => {
		const additionalRoles = admin.roles
			.filter(role => role !== Role.ADMIN)
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
	})

	const fileLink = await createFile({
		safeRows,
		feature: 'Administrateurs',
		customerName: currentUser.name,
	})

	return { status: 'success', fileLink }
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireRole(request, [Role.ADMIN])
	const formData = await request.formData()
	const intent = formData.get('intent') as string

	invariant(currentUser.churchId, 'Invalid churchId')

	if (intent === FORM_INTENT.EXPORT) {
		return exportAdmins(request, currentUser)
	}

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

		if (result && 'status' in result && result.status === 'error') {
			const errorMsg =
				'message' in result && typeof result.message === 'string'
					? result.message
					: 'Une erreur est survenue'
			return submission.reply({
				formErrors: [errorMsg],
			})
		}

		return result || { status: 'success' }
	}

	if (intent === FORM_INTENT.ADD_ADMIN) {
		const submission = await parseWithZod(formData, {
			schema: addAdminSchema.superRefine((fields, ctx) =>
				superRefineAddAdminHandler(fields, ctx, currentUser.churchId as string),
			),
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		const email = submission.value.email
		const password = submission.value.password

		await addAdmin(
			submission.value.userId,
			email ? email : undefined,
			password ? password : undefined,
			currentUser.churchId,
		)

		return { status: 'success' }
	}

	return { status: 'error', message: 'Intent non reconnu' }
}

export type ActionType = typeof actionFn
