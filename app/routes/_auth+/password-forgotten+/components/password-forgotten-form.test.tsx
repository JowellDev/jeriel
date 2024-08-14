import { createRemixStub } from '@remix-run/testing'
import { render, screen } from '~/utils/testing'
import { PasswordForgottenForm } from './password-forgotten-form'

describe('PasswordForgottenForm', () => {
	it('should render the form', ({ expect }) => {
		const RemixStub = createRemixStub([
			{
				path: '/',
				Component: PasswordForgottenForm,
			},
		])

		render(<RemixStub />)

		expect(screen.getByRole('textbox')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /récupérer mon compte/i }),
		).toBeInTheDocument()
	})
})
