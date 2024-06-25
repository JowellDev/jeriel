import { createRemixStub } from '@remix-run/testing'
import userEvent from '@testing-library/user-event'
import { render, screen } from '~/utils/testing'
import { VerifyForm } from './verify-form'

const user = userEvent.setup()

describe('VerifyForm', () => {
	it('should render', () => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: VerifyForm,
			},
		])

		render(<RemixStub />)

		expect(
			screen.getByRole('textbox', { name: /email address/i }),
		).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /otp/i })).toBeInTheDocument()

		expect(
			screen.getByRole('button', { name: /validate your email/i }),
		).toBeInTheDocument()
	})

	it('should display errors', async () => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: VerifyForm,
			},
		])

		render(<RemixStub />)

		await user.click(
			screen.getByRole('button', { name: /validate your email/i }),
		)

		expect(
			screen.getByText(/you must enter a valid email address/i),
		).toBeInTheDocument()
		expect(screen.getByText(/invalid otp/i)).toBeInTheDocument()

		await user.type(screen.getByLabelText(/otp/i), '12345')
		await user.click(
			screen.getByRole('button', { name: /validate your email/i }),
		)

		expect(screen.queryByText(/invalid otp/i)).not.toBeInTheDocument()
		expect(
			screen.getByText(/you must enter a 6 digits otp/i),
		).toBeInTheDocument()
	})
})
