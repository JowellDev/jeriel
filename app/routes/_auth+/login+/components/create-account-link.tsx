import { Button } from '#/button'
import { Link, useSearchParams } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export function CreateAccountLink() {
	const [searchParams] = useSearchParams()

	return (
		<div className="flex items-center justify-center pt-8">
			<p className="inline-block  px-2 text-sm text-slate-500">
				Don't have an account yet?{' '}
				<Button variant="link" className="text-xs p-0 h-auto">
					<Link
						prefetch="intent"
						className="link text-primary-focus"
						to={{ pathname: '/join', search: searchParams.toString() }}
					>
						Create one
					</Link>
				</Button>
			</p>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
