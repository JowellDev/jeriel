import { json } from '@remix-run/node'
import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '~/utils/testing'
import ResetPasswordPage from '../_index'

describe('ResetPasswordPage', () => {
	it('should render the page', async () => {
		const email = 'test@example.com'
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: ResetPasswordPage,
				loader() {
					return json({ email })
				},
				action() {
					return json(null)
				},
			},
		])

		render(<RemixStub />)

		expect(await screen.findByText(email)).toBeInTheDocument()
		expect(screen.getByText(/reset your password/i)).toBeInTheDocument()
		expect(screen.getByLabelText('New password')).toBeInTheDocument()
		expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
	})
})
