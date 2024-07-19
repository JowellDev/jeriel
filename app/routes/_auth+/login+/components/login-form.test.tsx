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

		expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /Connexion/i }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('checkbox', { name: /remember me/i }),
		).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /reset/i })).toBeInTheDocument()
	})

	it("should render fields' errors if submitted values are invalid", async () => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: LoginForm,
			},
		])

		render(<RemixStub />)

		await user.type(screen.getByLabelText(/email address/i), 'invalid email')
		await user.click(screen.getByRole('button', { name: /se connecter/i }))

		expect(
			screen.getByText(/you must enter a valid mail address/i),
		).toBeInTheDocument()
		expect(screen.getByText(/you must enter a password/i)).toBeInTheDocument()
	})

	it(
		"should render form's error if submitted values are invalid",
		async () => {
			const error = 'Invalid email/password'
			const RemixStub = createRemixStub([
				{
					path: '/',
					Component: LoginForm,
					action() {
						const submission = {
							error: {
								'': [error],
							},
							intent: 'submit',
							payload: {},
						} satisfies Submission<{ email: string; password: string }>
						return json(submission, { status: 400 })
					},
				},
			])

			render(<RemixStub />)

			await user.type(
				screen.getByLabelText(/email address/i),
				'test@example.com',
			)
			await user.type(screen.getByLabelText(/password/i), 'password')
			await user.click(screen.getByRole('button', { name: /se connecter/i }))

			expect(screen.getByText(error)).toBeInTheDocument()
		},
		{ retry: 3 },
	)
})
