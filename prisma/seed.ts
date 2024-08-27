import { PrismaClient, Role } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import invariant from 'tiny-invariant'

const prisma = new PrismaClient()

invariant(
	process.env.ARGON_SECRET_KEY,
	'ARGON_SECRET_KEY must be defined in .env file',
)
invariant(
	process.env.SUPER_ADMIN_PHONE,
	'SUPER_ADMIN_PHONE must be defined in .env file',
)
invariant(
	process.env.SUPER_ADMIN_PASSWORD,
	'SUPER_ADMIN_PASSWORD must be defined in .env file',
)

const argonSecretKey = process.env.ARGON_SECRET_KEY
const superAdminPhone = process.env.SUPER_ADMIN_PHONE
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD

async function seed() {
	await resetDatabase()
	await seedDB()
}

async function resetDatabase() {
	await removeSuperAdmin()
}

async function createMembers(count: number) {
	for (let i = 0; i < count; i++) {
		const memberData = {
			phone: `0123456${i.toString().padStart(3, '0')}`,
			name: `Membre Test ${i + 1}`,
			roles: [Role.MEMBER],
			isAdmin: false,
			churchId: 'cm0cp97z700003fx4utury005',
		}

		await prisma.user.create({
			data: memberData,
		})

		console.log(`Membre ${i + 1} créé avec succès`)
	}
}

async function seedDB() {
	await createSuperAdmin()
	await createMembers(5)
}

async function createSuperAdmin() {
	const hashedPassword = await hash(superAdminPassword, {
		secret: Buffer.from(argonSecretKey),
	})

	await prisma.user.create({
		data: {
			phone: superAdminPhone,
			name: 'Super Administrateur',
			roles: [Role.SUPER_ADMIN],
			isAdmin: true,
			password: {
				create: {
					hash: hashedPassword,
				},
			},
		},
	})
}

async function removeSuperAdmin() {
	await prisma.user
		.delete({ where: { phone: superAdminPhone } })
		.catch(() => {})
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
