import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '~/utils/testing'
import { PasswordForgottenLink } from './password-forgotten-link'

const RemixStub = createRemixStub([
	{
		path: '/',
		Component: PasswordForgottenLink,
	},
])

describe('PasswordForgottenLink', () => {
	it('should render', () => {
		render(<RemixStub />)

		expect(screen.getByText('Password forgotten?')).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /reset/i })).toBeInTheDocument()
	})
})
