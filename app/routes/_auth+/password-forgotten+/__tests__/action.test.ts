import type { User, Verification } from '@prisma/client'
import sendPasswordForgottenMail from '~/queues/send-email-verification-mail/send-email-verification-mail.server'
import { prisma } from '~/utils/db.server'
import { buildFormData } from '~/utils/form-data'
import { actionFn } from '../action.server'

vi.mock('~/utils/db.server', () => ({
	prisma: {
		user: {
			findFirst: vi.fn(),
		},
		verification: {
			deleteMany: vi.fn(),
			create: vi.fn(),
		},
	},
}))

vi.mock('~/utils/mailer.server', () => ({
	sendMail: vi.fn(),
}))

vi.mock(
	'~/queues/send-email-verification-mail/send-email-verification-mail.server',
	() => ({
		default: {
			enqueue: vi.fn(),
		},
	}),
)

vi.mock('~/utils/otp.server', () => ({
	generateTOTP: vi.fn().mockReturnValue({
		secret: 'secret',
		otp: '123456',
		algorithm: 'SHA256',
		expiresAt: new Date(),
		step: 60 * 10,
	}),
}))

describe('[password-forgotten] action', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	const mockedUserFindFirst = vi.mocked(prisma.user.findFirst)
	const mockedVerificationDeleteMany = vi.mocked(prisma.verification.deleteMany)
	const mockedVerificationCreate = vi.mocked(prisma.verification.create)

	const mockedEnqueue = vi.mocked(sendPasswordForgottenMail.enqueue)

	it('should not send password reset email if email match no user', async ({
		expect,
	}) => {
		mockedUserFindFirst.mockResolvedValue(null)

		const request = new Request('http://test.com/password-forgotten', {
			method: 'POST',
			body: buildFormData({ email: 'test@example.com' }),
			headers: {
				'X-Forwarded-Host': 'test.com',
			},
		})

		const response = await actionFn({ request, context: {}, params: {} })

		expect(response.status).toBe(200)
		expect(response.json()).resolves.toMatchObject({ success: true })

		expect(mockedVerificationDeleteMany).not.toHaveBeenCalled()
	})

	it('should queue password reset email sending if email match a user', async ({
		expect,
	}) => {
		const user = { email: 'test@example.com' } as User

		mockedUserFindFirst.mockResolvedValue(user)
		mockedVerificationDeleteMany.mockResolvedValue({ count: 0 })
		mockedVerificationCreate.mockResolvedValue({
			email: user.email,
		} as Verification)

		const request = new Request('http://test.com/password-forgotten', {
			method: 'POST',
			body: buildFormData({ email: user.email }),
			headers: {
				'X-Forwarded-Host': 'test.com',
			},
		})

		const response = await actionFn({ request, context: {}, params: {} })

		expect(response.status).toBe(200)
		expect(mockedVerificationCreate).toHaveBeenCalledOnce()

		const verifyLink = `https://test.com/password-forgotten/verify?otp=123456&email=${user.email.replace(/@/, '%40')}`

		expect(mockedEnqueue).toHaveBeenCalledWith(
			{ email: user.email, verifyLink, otp: '123456' },
			{ delay: '1s' },
		)
	})

	it('should keep pending verification to one per matching email', async ({
		expect,
	}) => {
		const verifications: unknown[] = [{ id: 1 }]

		mockedVerificationDeleteMany.mockImplementationOnce((() => {
			verifications.length = 0
		}) as any)

		mockedVerificationCreate.mockImplementationOnce(((data: unknown) => {
			verifications.push(data)
		}) as any)

		const request = new Request('http://test.com/password-forgotten', {
			method: 'POST',
			body: buildFormData({ email: 'test@email.com' }),
			headers: {
				'X-Forwarded-Host': 'test.com',
			},
		})

		await actionFn({ request: request, context: {}, params: {} })

		expect(verifications).toHaveLength(1)
	})
})
