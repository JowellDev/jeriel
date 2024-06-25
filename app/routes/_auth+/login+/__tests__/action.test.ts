import type { User } from '@prisma/client'
import { authenticator } from '~/utils/auth.server'
import { buildFormData } from '~/utils/form-data'
import action from '../action'

vi.mock('~/utils/auth.server', async () => ({
	...(await vi.importActual('~/utils/auth.server')),
	authenticator: {
		authenticate: vi.fn(),
	},
}))

const DEFAULT_BODY = {
	email: 'test@example.com',
	password: 'password',
	redirectTo: '/',
}

describe.concurrent('[login] action', () => {
	const mockedAuthenticate = vi.mocked(authenticator.authenticate)
	const user = { id: '123' } as User

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it.sequential(
		'should return response with status 400 if submission is invalid',
		async () => {
			mockedAuthenticate.mockImplementation(() => {
				throw new Error('Invalid email/password')
			})

			const request = buildRequest({ password: 'fakepassword' })

			const response = await action({ request, context: {}, params: {} })

			expect(response.status).toBe(400)
		},
	)

	it('should redirect to redirectTo url if login succeeded', async () => {
		mockedAuthenticate.mockResolvedValue(user)

		const redirectTo = '/'
		const request = buildRequest({ redirectTo })

		const response = await action({ request, context: {}, params: {} })

		expect(response.status).toBe(302)
		expect(response.headers.get('Location')).toBe(redirectTo)
	})

	it('should set session cookie if login succeeded', async () => {
		mockedAuthenticate.mockResolvedValue(user)

		const request = buildRequest()

		const response = await action({ request, context: {}, params: {} })

		expect(response.headers.get('Set-Cookie')).toContain(`_session=`)
	})

	it('should set max-age cookie if remember is checked on redirect response', async () => {
		mockedAuthenticate.mockResolvedValue(user)

		const request = buildRequest({ remember: 'on' })

		const response = await action({ request, context: {}, params: {} })

		expect(response.status).toBe(302)
		expect(response.headers.get('Set-Cookie')).toContain('Max-Age=604800')
	})

	it('should not set max-age cookie if remember is not checked on redirect response', async () => {
		mockedAuthenticate.mockResolvedValue(user)

		const request = buildRequest()

		const response = await action({ request, context: {}, params: {} })

		expect(response.status).toBe(302)
		expect(response.headers.get('Set-Cookie')).not.toContain('Max-Age=604800')
	})
})

function _buildFormData(data?: Record<string, string>) {
	return buildFormData({ ...DEFAULT_BODY, ...data })
}

function buildRequest(data?: Record<string, string>) {
	return new Request('http://test/login', {
		method: 'POST',
		body: _buildFormData(data),
	})
}
