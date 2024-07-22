import { json } from '@remix-run/node'
import { createRemixStub } from '@remix-run/testing'
import { render, screen, waitFor } from '~/utils/testing'
import { PasswordForgottenForm } from './password-forgotten-form'

vi.mock(
	'~/queues/send-email-verification-mail/send-email-verification-mail.server',
	() => ({}),
)

describe('PasswordForgottenForm', () => {
	it('should render the form', ({ expect }) => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: PasswordForgottenForm,
			},
		])

		render(<RemixStub />)

		expect(screen.getByRole('textbox')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /récupérer mon compte/i }),
		).toBeInTheDocument()
	})

	it('should show confirmation message after submitting form', async ({
		expect,
	}) => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: PasswordForgottenForm,
				action() {
					return json({ success: true })
				},
			},
		])

		render(<RemixStub />)

		await waitFor(async () => {
			expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
		})

		expect(
			await screen.findByText(
				/un mail de vérification a été envoyé à votre adresse e-mail/i,
			),
		).toBeInTheDocument()

		expect(await screen.findByText(/se connecter/i)).toBeInTheDocument()
	})
})
