import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '~/utils/testing'
import VerifyPage from '../_index'

describe('VerifyPage', () => {
	it('should render', () => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: VerifyPage,
			},
		])

		render(<RemixStub />)

		expect(screen.getByText(/vérification/i)).toBeInTheDocument()

		expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /otp/i })).toBeInTheDocument()

		expect(
			screen.getByRole('button', { name: /vérifier/i }),
		).toBeInTheDocument()
	})
})
