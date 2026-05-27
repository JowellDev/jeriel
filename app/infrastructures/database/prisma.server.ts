import { Prisma, PrismaClient } from '@prisma/client'
import { hash, verify } from '@node-rs/argon2'
import invariant from 'tiny-invariant'

let _prisma: PrismaClient

declare global {
	var __db__: PrismaClient
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === 'production') {
	_prisma = getClient()
} else {
	if (!global.__db__) {
		global.__db__ = getClient()
	}
	_prisma = global.__db__
}

function getClient() {
	const { DATABASE_URL, PRISMA_LOG_LEVEL } = process.env
	invariant(typeof DATABASE_URL === 'string', 'DATABASE_URL env var not set')

	const client = new PrismaClient({
		log: PRISMA_LOG_LEVEL?.split(',') as Prisma.LogLevel[],
	})
	// connect eagerly
	client.$connect()

	return client
}

// Prisma Extension.
// See https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions
// See https://www.prisma.io/blog/client-extensions-preview-8t3w27xkrxxn#the-components-of-an-extension

function getArgonSecret(): string {
	const { ARGON_SECRET_KEY } = process.env
	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY env var must be set')
	return ARGON_SECRET_KEY
}

async function hashWithArgon(password: string): Promise<string> {
	return hash(password, { secret: Buffer.from(getArgonSecret()) })
}

async function verifyWithArgon(
	passwordHash: string,
	password: string,
): Promise<boolean> {
	return verify(passwordHash, password, {
		secret: Buffer.from(getArgonSecret()),
	})
}

async function fetchUserWithPassword(email: string) {
	return _prisma.user.findFirst({
		where: {
			email,
			isAdmin: true,
			isActive: true,
			OR: [
				{ churchId: null },
				{ churchId: { not: null }, church: { isActive: true } },
			],
		},
		include: {
			password: true,
			tribe: true,
			honorFamily: true,
			department: true,
			church: true,
		},
	})
}

export interface CreateUserInput {
	name: string
	email: string
	password: string
}

const createUserExt = Prisma.defineExtension({
	name: 'createUser',
	model: {
		user: {
			async createUser({ name, email, password }: CreateUserInput) {
				const hashedPassword = await hashWithArgon(password)
				return _prisma.user.create({
					data: {
						name,
						email,
						password: { create: { hash: hashedPassword } },
					},
				})
			},
		},
	},
})

const resetPasswordExt = Prisma.defineExtension({
	name: 'resetPassword',
	model: {
		user: {
			async resetPassword(email: string, password: string) {
				const hashedPassword = await hashWithArgon(password)
				const user = await _prisma.user.findFirst({
					where: { email, isActive: true },
				})

				if (!user) return null

				return _prisma.user.update({
					where: { id: user.id },
					data: {
						password: {
							upsert: {
								update: { hash: hashedPassword },
								create: { hash: hashedPassword },
							},
						},
					},
				})
			},
		},
	},
})

const verifyLoginExt = Prisma.defineExtension({
	name: 'verifyLogin',
	model: {
		user: {
			async verifyLogin(email: string, password: string) {
				const userWithPassword = await fetchUserWithPassword(email)
				if (!userWithPassword?.password) return null

				const isValid = await verifyWithArgon(
					userWithPassword.password.hash,
					password,
				)

				if (!isValid) return null

				const { password: _password, ...userWithoutPassword } = userWithPassword
				return userWithoutPassword
			},
		},
	},
})

const hidePasswordExt = Prisma.defineExtension({
	name: 'hidePassword',
	model: {
		password: {
			hash: {
				need: {},
				compute() {
					return undefined
				},
			},
		},
	},
})

const prisma = _prisma
	.$extends(createUserExt)
	.$extends(resetPasswordExt)
	.$extends(verifyLoginExt)
	.$extends(hidePasswordExt)

export type PrismaTx = Prisma.TransactionClient

export { prisma }
