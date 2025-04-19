import { PrismaClient, Role } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import invariant from 'tiny-invariant'

const prisma = new PrismaClient()

async function main() {
	await createSuperAdmin()
}

async function createSuperAdmin() {
	const { ARGON_SECRET_KEY, SUPER_ADMIN_PHONE, SUPER_ADMIN_PASSWORD } =
		process.env

	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY must be defined in .env file')
	invariant(SUPER_ADMIN_PHONE, 'SUPER_ADMIN_PHONE must be defined in .env file')
	invariant(
		SUPER_ADMIN_PASSWORD,
		'SUPER_ADMIN_PASSWORD must be defined in .env file',
	)

	const hashedPassword = await hash(SUPER_ADMIN_PHONE, {
		secret: Buffer.from(ARGON_SECRET_KEY),
	})

	await prisma.user.create({
		data: {
			phone: SUPER_ADMIN_PHONE,
			name: 'Super Administrateur',
			roles: [Role.SUPER_ADMIN],
			churchId: undefined,
			isAdmin: true,
			password: {
				create: {
					hash: hashedPassword,
				},
			},
		},
	})
}

main()
