import { authenticator } from '~/utils/auth.server'
import { commitSession, getSession } from '~/utils/session.server'
import loader from '../loader'

describe.concurrent('[password-forgotten] loader', () => {
	it('should return an empty response with status 200', async () => {
		const request = new Request('http://test/password-forgotten')

		const response = await loader({ request, context: {}, params: {} })

		expect(response).toBeInstanceOf(Response)
		expect(response.status).toBe(200)
		await expect(response.json()).resolves.toEqual({})
	})

	it('should redirect to "/" if user is logged in', async () => {
		const session = await getSession('Cookie')
		session.set(authenticator.sessionKey, { id: 1 })

		const request = new Request('http://test/password-forgotten', {
			headers: {
				Cookie: await commitSession(session),
			},
		})

		await expect(() =>
			loader({ request, context: {}, params: {} }),
		).rejects.toThrow(Response)
	})
})
