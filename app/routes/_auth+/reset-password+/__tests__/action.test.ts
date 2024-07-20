import type { User } from '@prisma/client'
import { prisma } from '~/utils/db.server'
import { buildFormData } from '~/utils/form-data'
import { commitSession, getSession } from '~/utils/session.server'
import action from '../action.server'
import { RESET_PASSWORD_SESSION_KEY } from '../constants'

vi.mock('~/utils/db.server', () => ({
	prisma: {
		user: {
			resetPassword: vi.fn(),
		},
	},
}))

const DEFAULT_BODY = {
	password: 'password',
	passwordConfirm: 'password',
}

describe.concurrent('[reset-password] action', () => {
	const mockedResetPassword = vi.mocked(prisma.user.resetPassword)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should redirect to "/login" after updating password', async () => {
		const session = await getSession()
		session.set(RESET_PASSWORD_SESSION_KEY, 'test@example.com')

		const request = buildRequest(undefined, {
			headers: {
				Cookie: await commitSession(session),
			},
		})

		mockedResetPassword.mockResolvedValueOnce({ id: '123' } as User)

		const response = await action({ request, context: {}, params: {} })

		expect(response).toBeInstanceOf(Response)
		expect(response.status).toBe(302)
		expect(response.headers.get('Location')).toBe('/login')
		expect(response.headers.get('Set-Cookie')).toContain('_session')
	})

	it('should return 400 if password does not match', async () => {
		const session = await getSession()

		const request = buildRequest(
			{ passwordConfirm: 'password1' },
			{
				headers: {
					Cookie: await commitSession(session),
				},
			},
		)

		const response = await action({ request, context: {}, params: {} })

		expect(response).toBeInstanceOf(Response)
		expect(response.status).toBe(400)
	})

	it('should return 400 if email is not found in session', async () => {
		const request = buildRequest(undefined, {
			headers: {
				Cookie: await commitSession(await getSession()),
			},
		})

		const response = await action({ request, context: {}, params: {} })

		expect(response.status).toBe(302)
	})
})

function _buildFormData(body?: Record<string, string>) {
	return buildFormData({ ...DEFAULT_BODY, ...body })
}

function buildRequest(body?: Record<string, string>, init: RequestInit = {}) {
	return new Request('http://test.com/reset-password', {
		method: 'POST',
		body: _buildFormData(body),
		...init,
	})
}
