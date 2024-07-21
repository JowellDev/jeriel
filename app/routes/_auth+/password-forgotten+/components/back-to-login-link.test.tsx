import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '@testing-library/react'
import { BackToLoginLink } from './back-to-login-link'

describe('BackToLoginLink', () => {
	it('should render', () => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: BackToLoginLink,
			},
		])

		render(<RemixStub />)

		expect(
			screen.getByRole('link', { name: /se connecter/i }),
		).toBeInTheDocument()
		expect(screen.getByText(/déjà un compte?/i)).toBeInTheDocument()
	})
})
