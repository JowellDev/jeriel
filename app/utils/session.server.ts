// app/services/session.server.ts
import { createCookieSessionStorage } from '@remix-run/node'

export let sessionStorage = createCookieSessionStorage({
	cookie: {
		name: '_session',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: process.env.COOKIE_SECRETS?.split(','),
		secure: process.env.NODE_ENV === 'production',
	},
} as const)

export let { getSession, commitSession, destroySession } = sessionStorage
