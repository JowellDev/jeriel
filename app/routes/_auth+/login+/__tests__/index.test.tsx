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

		expect(
			screen.getByRole('heading', { name: /connexion/i }),
		).toBeInTheDocument()

		expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: /réinitialiser/i }),
		).toBeInTheDocument()

		expect(
			screen.getByRole('checkbox', { name: /se souvenir de moi/i }),
		).toBeInTheDocument()

		expect(
			screen.getByRole('button', { name: /se connecter/i }),
		).toBeInTheDocument()
	})
})
