import { createRemixStub } from '@remix-run/testing'
import userEvent from '@testing-library/user-event'
import { render, screen } from '~/utils/testing'
import { JoinForm } from './join-form'

const user = userEvent.setup()

vi.mock('~/queues/send-welcome-mail/send-welcome-mail.server', () => {
	return {
		default: {
			enqueue: vi.fn(),
		},
	}
})

const RemixStub = createRemixStub([
	{
		path: '/',
		Component: JoinForm,
	},
])

describe('JoinForm', () => {
	it('should render', async () => {
		render(<RemixStub />)

		expect(await screen.findByLabelText(/email address/i)).toBeInTheDocument()
		expect(await screen.findByLabelText(/password/i)).toBeInTheDocument()
		expect(
			await screen.findByRole('button', { name: /create account/i }),
		).toBeInTheDocument()
		expect(await screen.findByTestId('redirect-to')).toBeInTheDocument()
	})

	it('should render the error if input are invalid on submit', async () => {
		render(<RemixStub />)

		await user.type(screen.getByLabelText(/email address/i), 'email')
		await user.type(screen.getByLabelText(/password/i), 'passor')
		await user.click(screen.getByRole('button', { name: /create account/i }))

		expect(
			await screen.findByText(/you must enter a valid mail address/i),
		).toBeInTheDocument()
		expect(
			await screen.findByText(/password must be at least 8 characters/i),
		).toBeInTheDocument()
	})
})
