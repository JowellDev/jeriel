import type { Submission } from '@conform-to/react'
import { json } from '@remix-run/node'
import { createRemixStub } from '@remix-run/testing'
import userEvent from '@testing-library/user-event'
import { render, screen } from '~/utils/testing'
import { LoginForm } from './login-form'

const user = userEvent.setup()

describe('LoginForm', () => {
	it('should render', () => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: LoginForm,
			},
		])

		render(<RemixStub />)

		expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: /réinitialiser/i }),
		).toBeInTheDocument()

		expect(
			screen.getByRole('checkbox', { name: /se souvenir de moi/i }),
		).toBeInTheDocument()

		expect(
			screen.getByRole('button', { name: /se connecter/i }),
		).toBeInTheDocument()
	})

	it("should render fields' errors if submitted values are invalid", async () => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: LoginForm,
			},
		])

		render(<RemixStub />)

		await user.type(screen.getByLabelText(/email/i), 'invalid email')
		await user.click(screen.getByRole('button', { name: /se connecter/i }))

		expect(screen.getByText(/adresse e-mail invalide/i)).toBeInTheDocument()

		expect(
			screen.getByText(/veuillez entrer votre mot de passe/i),
		).toBeInTheDocument()
	})

	it(
		"should render form's error if submitted values are invalid",
		async () => {
			const error = 'Email et/ou mot de passe invalide(s)'
			const RemixStub = createRemixStub([
				{
					path: '/',
					Component: LoginForm,
					action() {
						const submission = {
							error: {
								'': [error],
							},
							payload: {},
						} as unknown as Submission<{ email: string; password: string }>
						return json(submission, { status: 400 })
					},
				},
			])

			render(<RemixStub />)

			await user.type(screen.getByLabelText(/email/i), 'test@example.com')
			await user.type(screen.getByLabelText(/mot de passe/i), 'password')
			await user.click(screen.getByRole('button', { name: /se connecter/i }))

			expect(screen.getByText(error)).toBeInTheDocument()
		},
		{ retry: 2 },
	)
})
