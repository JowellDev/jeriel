import { faker } from '@faker-js/faker'
import execa from 'execa'
import { prisma } from '~/utils/db.server'
import { generateTOTP } from '~/utils/otp.server'

export async function setupDb() {
	await execa(
		'yarn',
		['prisma', 'migrate', 'reset', '--force', '--skip-generate'],
		{
			stdio: 'inherit',
		},
	)
}

export async function createUser(
	email = faker.internet.email(),
	password = faker.internet.password(),
) {
	return prisma.user.createUser(email, password)
}

export function createManyUsers(count = 1) {
	const promises$ = Array.from({ length: count }).map(() => createUser())
	return Promise.all(promises$)
}

export async function createVerification(email = faker.internet.email()) {
	const otpData = generateTOTP()

	await prisma.verification.create({
		data: {
			algorithm: otpData.algorithm,
			digits: 6,
			email,
			period: otpData.step,
			expiresAt: otpData.expiresAt,
			secret: otpData.secret,
		},
	})

	return otpData.otp
}
