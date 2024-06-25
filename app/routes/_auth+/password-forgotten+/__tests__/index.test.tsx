import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '~/utils/testing'
import PasswordForgottenPage from '../_index'

vi.mock(
	'~/queues/send-email-verification-mail/send-email-verification-mail.server',
	() => ({}),
)

describe('PasswordForgottenPage', () => {
	it('renders successfully', async () => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: PasswordForgottenPage,
			},
		])

		render(<RemixStub />)

		expect(screen.getByText(/password forgotten/i)).toBeInTheDocument()
		expect(
			screen.getByRole('textbox', { name: /email address/i }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /send verification mail/i }),
		).toBeInTheDocument()

		expect(
			screen.getByRole('link', { name: /back to login/i }),
		).toBeInTheDocument()
		expect(screen.getByText(/remember your password?/i)).toBeInTheDocument()
	})
})
