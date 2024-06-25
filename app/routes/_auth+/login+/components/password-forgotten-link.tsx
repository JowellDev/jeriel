import { Button } from '#/button'
import { Link } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export function PasswordForgottenLink() {
	return (
		<div className="flex justify-end mt-1">
			<span className="text-xs text-zinc-500">
				Password forgotten?{' '}
				<Button variant="link" className="text-xs p-0 h-auto">
					<Link
						prefetch="intent"
						className="link-secondary link"
						to="/password-forgotten"
					>
						Reset
					</Link>
				</Button>
			</span>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
