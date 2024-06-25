import { authenticator } from '~/utils/auth.server'
import { commitSession, getSession } from '~/utils/session.server'
import { RESET_PASSWORD_SESSION_KEY } from '../constants'
import loader from '../loader'

describe.concurrent('[reset-password] loader', () => {
	it('should return a response with a 200 status code', async () => {
		const session = await getSession()
		session.set(RESET_PASSWORD_SESSION_KEY, 'test@example.com')

		const request = buildRequest({
			headers: {
				Cookie: await commitSession(session),
			},
		})

		const response = await loader({ request, context: {}, params: {} })

		expect(response.status).toBe(200)
		expect(response.headers.get('Set-Cookie')).toContain('_session')
	})

	it('should redirect to / if user is already logged in', async () => {
		const session = await getSession()
		session.set(authenticator.sessionKey, { id: '123' })

		const request = buildRequest({
			headers: {
				Cookie: await commitSession(session),
			},
		})

		await expect(() =>
			loader({ request, context: {}, params: {} }),
		).rejects.toThrow(Response)
	})

	it('should redirect to / if email is not set in the session', async () => {
		const request = buildRequest({
			headers: {
				Cookie: await commitSession(await getSession()),
			},
		})

		const response = await loader({ request, context: {}, params: {} })

		expect(response.status).toBe(302)
		expect(response.headers.get('Location')).toBe('/')
	})
})

function buildRequest(init: RequestInit = {}) {
	return new Request('http://test.com/reset-password', init)
}
