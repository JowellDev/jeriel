import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '~/utils/testing'
import { CreateAccountLink } from './create-account-link'

const RemixStub = createRemixStub([
	{
		path: '/',
		Component: CreateAccountLink,
	},
])

describe('CreateAccountLink', () => {
	it('should render', () => {
		render(<RemixStub />)

		expect(screen.getByText("Don't have an account yet?")).toBeInTheDocument()
		expect(screen.getByRole('link')).toBeInTheDocument()
	})
})
