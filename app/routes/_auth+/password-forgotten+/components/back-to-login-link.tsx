import { Button } from '~/components/ui/button'
import { Link, useSearchParams } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export function BackToLoginLink() {
	const [searchParams] = useSearchParams()

	return (
		<div className="flex items-center justify-center pt-8">
			<p className="inline-block px-2 text-sm text-slate-500">
				Déjà un compte ?{' '}
				<Button variant="link" className="p-0">
					<Link
						prefetch="intent"
						className="link text-primary-focus"
						to={{ pathname: '/login', search: searchParams.toString() }}
					>
						se connecter
					</Link>
				</Button>
			</p>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
