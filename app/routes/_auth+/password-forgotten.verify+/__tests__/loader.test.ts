import { validate } from '../action'
import loader from '../loader'

vi.mock('../action', async () => ({
	...(await vi.importActual('../action')),
	validate: vi.fn(),
}))

describe('[password-forgotten.verify] loader', () => {
	const mockedValidate = vi.mocked(validate)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should return a response with status 200 if otp not prefilled', async () => {
		const request = new Request('https://test.com/')

		const response = await loader({ request, context: {}, params: {} })

		expect(response).toBeInstanceOf(Response)
		expect(response.status).toBe(200)
	})

	it('should return a response with status 400 if data are invalid', async () => {
		const request = new Request(
			'http://test.com?otp=123456&email=test@example.com',
		)

		mockedValidate.mockResolvedValueOnce(new Response(null, { status: 400 }))

		const response = await loader({ request, context: {}, params: {} })

		expect(response).toBeInstanceOf(Response)
		expect(response.status).toBe(400)
	})

	it('should redirect to /reset-password if otp is valid', async () => {
		const request = new Request(
			'https://test.com?otp=123456&email=test@example.com',
		)

		mockedValidate.mockResolvedValueOnce(
			new Response(null, {
				status: 302,
				headers: { Location: '/reset-password' },
			}),
		)

		const response = await loader({ request, context: {}, params: {} })

		expect(response.status).toBe(302)
	})
})
