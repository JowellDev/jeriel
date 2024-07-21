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

		expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /otp/i })).toBeInTheDocument()

		expect(
			screen.getByRole('button', { name: /vérifier/i }),
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

		await user.click(screen.getByRole('button', { name: /vérifier/i }))

		expect(
			screen.getByText(/Veuillez entrer une adresse email valide/i),
		).toBeInTheDocument()
		expect(
			screen.getByText(/Veuillez entrer le code OTP de vérification/i),
		).toBeInTheDocument()

		await user.type(screen.getByLabelText(/otp/i), '12345')
		await user.click(screen.getByRole('button', { name: /vérifier/i }))

		expect(
			screen.getByText(/Veuillez entrer un code OTP de 6 caractères/i),
		).toBeInTheDocument()
	})
})
