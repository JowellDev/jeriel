import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '~/utils/testing'
import { LoginLink } from './login-link'

describe('LoginLink', () => {
	it('should render', async () => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: LoginLink,
			},
		])

		render(<RemixStub />)

		expect(
			await screen.findByText(/already have an account/i),
		).toBeInTheDocument()
		expect(await screen.findByText(/log in/i)).toBeInTheDocument()
	})
})
