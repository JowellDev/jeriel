import type { User } from '@prisma/client'
import { redirect } from '@remix-run/node'
import { Authenticator } from 'remix-auth'
import { FormStrategy } from 'remix-auth-form'
import invariant from 'tiny-invariant'
import { prisma } from './db.server'
import { commitSession, getSession, sessionStorage } from './session.server'

export const AUTH_SESSION_ERROR_KEY = 'AUTH_SESSION_ERROR_KEY'
export const DEFAAULT_REDIRECTION_URL = '/'

export interface AuthenticatedUser extends User {}

export type CreateSessionArgs = {
	request: Request
	user: User
	remember: boolean
	redirectTo: string
}

export let authenticator = new Authenticator<User | null>(sessionStorage, {
	sessionErrorKey: AUTH_SESSION_ERROR_KEY,
	sessionKey: 'sessionId',
})

authenticator.use(
	new FormStrategy(async ({ form }) => {
		const email = form.get('email')
		const password = form.get('password')

		invariant(typeof email === 'string', 'Email must be a string')
		invariant(typeof password === 'string', 'Email must be a string')

		const user = prisma.user.verifyLogin(email, password)

		return user
	}),
	FormStrategy.name,
)

export async function requireAnonymous(
	request: Request,
	redirectTo: string = DEFAAULT_REDIRECTION_URL,
) {
	await authenticator.isAuthenticated(request, { successRedirect: redirectTo })
}

export async function getUserId(
	request: Request,
): Promise<User['id'] | undefined> {
	const user = await authenticator.isAuthenticated(request)
	return user?.id
}

export async function getUser(request: Request) {
	return authenticator.isAuthenticated(request)
}

export async function requireUserId(
	request: Request,
	redirectTo: string = new URL(request.url).pathname,
) {
	const searchParams = new URLSearchParams({ redirectTo })

	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: `/login?${searchParams}`,
	})
	invariant(user, 'You must be logged in')

	return user.id
}

export async function requireUser(
	request: Request,
	redirectTo: string = new URL(request.url).pathname,
) {
	const searchParams = new URLSearchParams({ redirectTo })

	const user = await authenticator.isAuthenticated(request, {
		failureRedirect: `/login?${searchParams}`,
	})
	invariant(user, 'User must be defined')

	return user
}

export async function logout(request: Request, redirectTo = '/login') {
	return authenticator.logout(request, { redirectTo })
}

export async function createUserSession({
	request,
	user,
	remember,
	redirectTo,
}: CreateSessionArgs) {
	const session = await getSession(request.headers.get('cookie'))
	session.set(authenticator.sessionKey, user)

	return redirect(redirectTo, {
		headers: {
			'Set-Cookie': await commitSession(session, {
				maxAge: remember
					? 60 * 60 * 24 * 7 // 7 days
					: undefined,
			}),
		},
	})
}
