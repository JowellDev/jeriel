import { faker } from '@faker-js/faker'

export function generateUserCredentials(
	email = faker.internet.email({ provider: 'example.com' }),
	password = faker.internet.password({ length: 8, memorable: false }),
) {
	if (!email.endsWith('@example.com'))
		throw new Error('Email must be @example.com')

	return {
		email: email,
		password: password,
	}
}
