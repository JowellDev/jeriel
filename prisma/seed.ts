import { PrismaClient, Role } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import invariant from 'tiny-invariant'

const prisma = new PrismaClient()

async function seed() {
	await seedDB()
}

async function seedDB() {
	await createSuperAdmin()
}

async function createSuperAdmin() {
	const { ARGON_SECRET_KEY, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } =
		process.env

	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY must be defined in .env file')
	invariant(SUPER_ADMIN_EMAIL, 'SUPER_ADMIN_EMAIL must be defined in .env file')
	invariant(
		SUPER_ADMIN_PASSWORD,
		'SUPER_ADMIN_PASSWORD must be defined in .env file',
	)

	const hashedPassword = await hash(SUPER_ADMIN_PASSWORD, {
		secret: Buffer.from(ARGON_SECRET_KEY),
	})

	await prisma.user.create({
		data: {
			email: SUPER_ADMIN_EMAIL,
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

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
