import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'
import invariant from 'tiny-invariant'

const prisma = new PrismaClient()

invariant(
	process.env.ARGON_SECRET_KEY,
	'ARGON_SECRET_KEY must be defined in .env file',
)
invariant(
	process.env.SUPER_ADMIN_EMAIL,
	'SUPER_ADMIN_EMAIL must be defined in .env file',
)
invariant(
	process.env.SUPER_ADMIN_PASSWORD,
	'SUPER_ADMIN_PASSWORD must be defined in .env file',
)

const argonSecretKey = process.env.ARGON_SECRET_KEY
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD

async function seed() {
	console.time('Resetting DB...')
	await resetDatabase()
	console.timeEnd('Resetting DB...')

	const hashedPassword = await argon2.hash(superAdminPassword, {
		secret: Buffer.from(argonSecretKey),
	})

	console.time('Seeding DB...')
	await prisma.user.create({
		data: {
			email: superAdminEmail,
			password: {
				create: {
					hash: hashedPassword,
				},
			},
		},
	})

	console.timeEnd(`Seeding DB...`)
}

async function resetDatabase() {
	await prisma.user
		.delete({ where: { email: superAdminEmail } })
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
