import type { Verification } from '@prisma/client'
import { prisma } from '~/utils/db.server'
import { buildFormData } from '~/utils/form-data'
import { verifyTOTP } from '~/utils/otp.server'
import { actionFn } from '../action.server'

vi.mock('~/utils/db.server', () => ({
	prisma: {
		verification: {
			findFirst: vi.fn(),
			deleteMany: vi.fn(),
		},
	},
}))

vi.mock('~/utils/otp.server', () => ({
	verifyTOTP: vi.fn(),
}))

describe('[password-forgotten.verify] action', () => {
	const mockedFindFirst = vi.mocked(prisma.verification.findFirst)
	const mockedVerifyTOTP = vi.mocked(verifyTOTP)
	const mockedDeleteMany = vi.mocked(prisma.verification.deleteMany)

	beforeEach(() => {
		mockedDeleteMany.mockResolvedValue({ count: 1 })
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should redirect if otp and email match is valid', async () => {
		const phone = '0101010101'

		mockedFindFirst.mockResolvedValueOnce({
			phone,
			id: '123',
		} as Verification)

		mockedVerifyTOTP.mockReturnValueOnce(true)

		const request = buildRequest({ otp: '123456', phone })

		const response = await actionFn({ request, context: {}, params: {} })

		expect(response).toBeInstanceOf(Response)
		expect(response.status).toBe(302)
		expect(response.headers.get('Location')).toBe('/reset-password')

		expect(response.headers.get('Set-Cookie')).toContain('_session')
	})

	it('should return 400 if otp is invalid', async () => {
		const phone = '0101010101'

		mockedFindFirst.mockResolvedValueOnce({
			phone,
			id: '123',
		} as Verification)

		mockedVerifyTOTP.mockReturnValueOnce(false)

		const request = buildRequest({ otp: '123456', phone })

		const response = await actionFn({ request, context: {}, params: {} })

		expect(response.status).toBe(400)
	})

	it('should return 400 if email has no pending verification', async () => {
		mockedFindFirst.mockResolvedValueOnce(null)

		const request = buildRequest({ otp: '123456', email: 'test@example.com' })

		const response = await actionFn({ request, context: {}, params: {} })

		expect(response.status).toBe(400)
	})
})

function buildRequest(body: Record<string, string>) {
	return new Request('http://test.com/', {
		method: 'POST',
		body: buildFormData(body),
	})
}
