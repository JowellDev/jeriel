import { Button } from '~/components/ui/button'
import { Link } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export function PasswordForgottenLink() {
	return (
		<div className="flex justify-center lg:justify-end items-center space-x-2 mt-4 text-sm text-zinc-500">
			<span>Mot de passe oublié ?</span>
			<Button variant="link" className="text-sm p-0 h-auto">
				<Link
					prefetch="intent"
					className="link-secondary"
					to="/password-forgotten"
				>
					Réinitialiser
				</Link>
			</Button>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
