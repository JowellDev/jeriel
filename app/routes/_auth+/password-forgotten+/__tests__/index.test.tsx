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

		expect(screen.getByText(/mot de passe oublié/i)).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /vérifier/i }),
		).toBeInTheDocument()

		expect(
			screen.getByRole('link', { name: /se connecter/i }),
		).toBeInTheDocument()
		expect(screen.getByText(/déjà un compte ?/i)).toBeInTheDocument()
	})
})
