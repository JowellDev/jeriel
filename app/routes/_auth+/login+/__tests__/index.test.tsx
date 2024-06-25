import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '~/utils/testing'
import LoginPage from '../_index'

describe('[login] index', () => {
	it('should render', () => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: LoginPage,
			},
		])

		render(<RemixStub />)

		expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument()

		expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /reset/i })).toBeInTheDocument()

		expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
		expect(
			screen.getByRole('checkbox', { name: /remember me/i }),
		).toBeInTheDocument()

		expect(screen.getByText(/don't have an account yet/i)).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /create/i })).toBeInTheDocument()
	})
})
