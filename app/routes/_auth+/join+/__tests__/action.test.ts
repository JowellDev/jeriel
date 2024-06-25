import type { User } from '@prisma/client'
import queue from '~/queues/send-welcome-mail/send-welcome-mail.server'
import { prisma } from '~/utils/db.server'
import { buildFormData } from '~/utils/form-data'
import action from '../action'

vi.mock('~/queues/send-welcome-mail/send-welcome-mail.server', () => {
	return {
		default: {
			enqueue: vi.fn(),
		},
	}
})

vi.mock('~/utils/db.server', async () => {
	return {
		prisma: {
			user: {
				findUnique: vi.fn(),
				createUser: vi.fn(),
			},
		},
	}
})

const DEFAULT_BODY = {
	email: 'test@example.com',
	password: 'password',
	redirectTo: '/',
}

describe.concurrent('[join] action', () => {
	const mockedEnqueue = vi.mocked(queue.enqueue)
	const mockedCreateUser = vi.mocked(prisma.user.createUser)
	const mockedFindUnique = vi.mocked(prisma.user.findUnique)

	const mockUser = { id: '123' }

	beforeEach(() => {
		mockedEnqueue.mockResolvedValue({} as never)
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('should redirect to / if data are valid', async ({ expect }) => {
		mockedCreateUser.mockResolvedValue(mockUser as User)
		mockedFindUnique.mockResolvedValue(null)

		const request = buildRequest()

		await expect(() =>
			action({
				request,
				context: {},
				params: {},
			}),
		).rejects.toThrow(Response)
	})

	it.sequential('should queue mail after creating user', async () => {
		mockedCreateUser.mockResolvedValue(mockUser as User)
		mockedFindUnique.mockResolvedValue(null)

		const request = buildRequest()

		await expect(() =>
			action({
				request,
				context: {},
				params: {},
			}),
		).rejects.toThrow(Response)

		expect(queue.enqueue).toHaveBeenCalledOnce()
		expect(queue.enqueue).toHaveBeenCalledWith(mockUser, { delay: '1s' })
	})

	it('should return a response with 400 status if email is already taken', async () => {
		mockedFindUnique.mockResolvedValue(mockUser as User)

		const request = buildRequest()

		const response = await action({
			request,
			context: {},
			params: {},
		})

		expect(response).toBeInstanceOf(Response)
		expect(response.status).toBe(400)
	})

	it('should return a response with status 400 if data are invalid', async () => {
		const request = buildRequest()

		const response = await action({
			request,
			context: {},
			params: {},
		})

		expect(response).toBeInstanceOf(Response)
		expect(response.status).toBe(400)
	})

	it('should return a response with status 400 if intent is not submit', async () => {
		const request = buildRequest({ intent: 'test' })

		const response = await action({
			request,
			context: {},
			params: {},
		})

		expect(response.status).toBe(400)
	})
})

function buildRequest(data?: Record<string, string>) {
	return new Request('http://test.com/join', {
		method: 'POST',
		body: _buildFormData(data),
	})
}

function _buildFormData(data?: Record<string, string>) {
	return buildFormData({ ...DEFAULT_BODY, ...data })
}
