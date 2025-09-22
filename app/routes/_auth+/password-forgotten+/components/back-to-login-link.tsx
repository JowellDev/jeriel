import { Button } from '~/components/ui/button'
import { Link, useSearchParams } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export function BackToLoginLink() {
	const [searchParams] = useSearchParams()

	return (
		<div className="flex items-center justify-center mt-4 text-sm text-slate-500 space-x-2">
			<span>Déjà un compte ?</span>
			<Button variant="link" className="p-0">
				<Link
					prefetch="intent"
					className="link text-primary-focus"
					to={{ pathname: '/login', search: searchParams.toString() }}
				>
					se connecter
				</Link>
			</Button>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
