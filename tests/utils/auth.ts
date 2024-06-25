import { faker } from '@faker-js/faker'
import { parse } from 'cookie'
import { createUserSession } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export async function createSessionCookie(
	email = faker.internet.email({ provider: 'example.com' }),
	password = faker.internet.password(),
) {
	if (!email.endsWith('@example.com')) {
		throw new Error('All test emails must end in @example.com')
	}

	const user = await prisma.user.createUser(email, password)

	const response = await createUserSession({
		request: new Request('test://test'),
		user,
		remember: false,
		redirectTo: '/',
	})

	const cookieValue = response.headers.get('Set-Cookie')
	if (!cookieValue) {
		throw new Error('Cookie missing from createUserSession response')
	}

	return parse(cookieValue)._session
}
