import { authenticator } from '~/utils/auth.server'
import { commitSession, getSession } from '~/utils/session.server'
import loader from '../loader'

const BASE_URL = 'http://test.com/join'

describe.concurrent('[join] loader', () => {
	it('should return a 200 response if user not logged', async () => {
		const response = await loader({
			request: new Request(BASE_URL),
			context: {},
			params: {},
		})

		expect(response).toBeInstanceOf(Response)
	})

	it('should return an empty object', async () => {
		const response = await loader({
			request: new Request(BASE_URL),
			context: {},
			params: {},
		})

		const body = await response.json()

		expect(body).toEqual({})
	})

	it('should redirect is user is already logged', async () => {
		const session = await getSession('Cookie')
		session.set(authenticator.sessionKey, { id: '123' })

		const request = new Request(BASE_URL, {
			headers: {
				Cookie: await commitSession(session),
			},
		})

		const response = await loader({
			context: {},
			params: {},
			request,
		})

		expect(response.status).toBe(302)
	})
})
