import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '~/utils/testing'
import Join from '../_index'

vi.mock('~/queues/send-welcome-mail/send-welcome-mail.server', () => {
	return {
		default: {
			enqueue: vi.fn(),
		},
	}
})

describe('Join Page', () => {
	const RemixStub = createRemixStub([
		{
			path: '/',
			Component: Join,
		},
	])

	it('renders successfully', async () => {
		render(<RemixStub />)

		expect(screen.getByText(/join us/i)).toBeInTheDocument()

		expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /create account/i }),
		).toBeInTheDocument()

		expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
	})
})
