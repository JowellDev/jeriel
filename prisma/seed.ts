import { Prisma, PrismaClient, Role } from '@prisma/client'
import { hash } from '@node-rs/argon2'
import invariant from 'tiny-invariant'
import { faker } from '@faker-js/faker'

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
	await removeUsers()
	await removeChurchs()
}

async function seedDB() {
	await createUsers(26)
	await createChurchs()
	await createSuperAdmin()
}

async function createSuperAdmin() {
	const hashedPassword = await hash(superAdminPassword, {
		secret: Buffer.from(argonSecretKey),
	})

	const church = await prisma.church.findFirst()
	invariant(church, 'church is required to create admin')

	await prisma.user.create({
		data: {
			phone: superAdminPhone,
			name: 'Super Administrateur',
			roles: [Role.SUPER_ADMIN],
			churchId: church.id,
			isAdmin: true,
			password: {
				create: {
					hash: hashedPassword,
				},
			},
		},
	})
}

async function createChurchs() {
	const admins = await prisma.user.findMany({ take: 3, select: { id: true } })

	const data = [
		{ name: 'Church of God', isActive: true, adminId: admins[0].id },
		{ name: 'Church of Christ', isActive: true, adminId: admins[1].id },
		{ name: 'Church of Winners', isActive: true, adminId: admins[2].id },
	]

	await prisma.church.createMany({
		data,
	})
}

async function createUsers(total: number) {
	const data: Prisma.UserCreateManyInput[] = []
	for (let index = 0; index < total; index++) {
		data.push({ name: faker.person.fullName(), phone: faker.phone.number() })
	}
	return await prisma.user.createManyAndReturn({ data })
}

async function removeUsers() {
	await prisma.user.deleteMany().catch(() => {})
}

async function removeChurchs() {
	await prisma.user.deleteMany().catch(() => {})
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
