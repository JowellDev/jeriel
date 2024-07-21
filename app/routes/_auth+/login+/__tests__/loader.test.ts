import { authenticator } from '~/utils/auth.server'
import { commitSession, getSession } from '~/utils/session.server'
import { loaderFn } from '../loader.server'

const BASE_URL = 'http://test.com/login'

describe.concurrent('[login] loader', () => {
	it('should return an empty response with status 200', async () => {
		const response = await loaderFn({
			request: new Request(BASE_URL),
			context: {},
			params: {},
		})

		expect(response.status).toBe(200)
		await expect(response.json()).resolves.toEqual({})
	})

	it('should redirect to "/" if user is logged in', async () => {
		const session = await getSession('Cookie')
		session.set(authenticator.sessionKey, { id: 1 })

		const request = new Request(BASE_URL, {
			headers: {
				Cookie: await commitSession(session),
			},
		})

		const response = await loaderFn({ request, context: {}, params: {} })

		expect(response.status).toBe(302)
		expect(response.headers.get('Location')).toBe('/')
	})
})
