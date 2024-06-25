import { json } from '@remix-run/node'
import { createRemixStub } from '@remix-run/testing'
import userEvent from '@testing-library/user-event'
import { render, screen } from '~/utils/testing'
import { ResetPasswordForm } from './reset-password-form'

const user = userEvent.setup()

describe('ResetPasswordForm', () => {
	const email = 'test@example.com'
	const RemixStub = createRemixStub([
		{
			path: '/',
			Component: ResetPasswordForm,
			loader() {
				return json({ email })
			},
			action() {
				return json(null)
			},
		},
	])

	it('should render the form', async () => {
		render(<RemixStub />)

		expect(await screen.findByText(email)).toBeInTheDocument()
		expect(screen.getByLabelText('New password')).toBeInTheDocument()
		expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /reset password/i }),
		).toBeInTheDocument()
	})

	it('should display error messages', async () => {
		render(<RemixStub />)

		await user.click(
			await screen.findByRole('button', { name: /reset password/i }),
		)

		expect(
			await screen.findByText('You must enter a new password'),
		).toBeInTheDocument()

		await user.type(screen.getByLabelText('New password'), 'passw')
		await user.click(screen.getByRole('button', { name: /reset password/i }))

		expect(
			await screen.findByText('Password must contains at least 8 characters'),
		).toBeInTheDocument()

		await user.type(screen.getByLabelText('New password'), 'password')
		await user.type(screen.getByLabelText('Confirm new password'), 'password1')

		await user.click(screen.getByRole('button', { name: /reset password/i }))

		expect(
			await screen.findByText('Password does not match'),
		).toBeInTheDocument()
	})
})
