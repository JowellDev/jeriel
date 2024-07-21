import { Button } from '~/components/ui/button'
import { Link } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export function PasswordForgottenLink() {
	return (
		<div className="flex justify-end mt-4">
			<span className="text-sm text-zinc-500">
				Mot de passe oublié ?{' '}
				<Button variant="link" className="text-sm p-0 h-auto">
					<Link
						prefetch="intent"
						className="link-secondary"
						to="/password-forgotten"
					>
						Réinitialiser
					</Link>
				</Button>
			</span>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
