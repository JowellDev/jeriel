import { json } from '@remix-run/node'
import { createRemixStub } from '@remix-run/testing'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '~/utils/testing'
import { PasswordForgottenForm } from './password-forgotten-form'

vi.mock(
	'~/queues/send-email-verification-mail/send-email-verification-mail.server',
	() => ({}),
)

const user = userEvent.setup()

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
			screen.getByRole('button', { name: /vérifier/i }),
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

		await user.type(
			screen.getByRole('textbox', { name: /email/i }),
			'test@example.com',
		)
		await user.click(screen.getByRole('button', { name: /vérifier/i }))

		await waitFor(async () => {
			expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
		})

		expect(
			await screen.findByText(
				/un mail de vérification a été envoyé à votre adresse e-mail/i,
			),
		).toBeInTheDocument()

		expect(await screen.findByText(/se connecter/i)).toBeInTheDocument()
		expect(await screen.findByRole('img')).toBeInTheDocument()
	})
})
