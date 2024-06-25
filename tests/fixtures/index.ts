import type { Cookie } from '@playwright/test'
import { test as base } from '@playwright/test'
import { installGlobals } from '@remix-run/node'
import { createSessionCookie } from '../utils/auth'
import { HomePage } from './home-page'
import { PasswordForgottenPage } from './password-forgotten-page'
import { PasswordResetPage } from './password-rest-page'
import { SignInPage } from './signin-page'
import { SignUpPage } from './signup-page'

installGlobals()

type Fixtures = {
	login: (email?: string, password?: string) => Promise<void>
	getSessionCookie: () => Promise<Cookie | undefined>
	signupPage: SignUpPage
	signInPage: SignInPage
	passwordForgottenPage: PasswordForgottenPage
	passwordResetPage: PasswordResetPage
	homePage: HomePage
}

const test = base.extend<Fixtures>({
	login: async ({ context }, use) => {
		await use(async (email?: string, password?: string) => {
			const cookie = await createSessionCookie(email, password)

			await context.addCookies([
				{
					name: '_session',
					value: cookie,
					domain: 'localhost',
					path: '/',
					httpOnly: true,
					secure: false,
					sameSite: 'Lax',
				},
			])
		})
	},
	getSessionCookie: async ({ context }, use) => {
		await use(async () => {
			const cookies = await context.cookies()
			const cookieName = '_session'
			return cookies.find(c => c.name === cookieName)
		})
	},
	signupPage: async ({ page, context }, use) => {
		await use(new SignUpPage(page, context))
	},
	signInPage: async ({ page, context }, use) => {
		await use(new SignInPage(page, context))
	},
	passwordForgottenPage: async ({ page }, use) => {
		await use(new PasswordForgottenPage(page))
	},
	passwordResetPage: async ({ page }, use) => {
		await use(new PasswordResetPage(page))
	},
	homePage: async ({ page }, use) => {
		await use(new HomePage(page))
	},
})

test.describe.configure({ mode: process.env.CI ? 'parallel' : 'serial' })

export { expect } from '@playwright/test'
export { test }
