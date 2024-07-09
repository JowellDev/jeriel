import { Button } from '~/components/ui/button'
import { Link, useSearchParams } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export function LoginLink() {
	const [searchParams] = useSearchParams()

	return (
		<div className="flex items-center justify-center pt-8">
			<p className="text-center text-sm text-zinc-500">
				Already have an account?{' '}
				<Button variant="link" className="p-0 h-auto">
					<Link
						prefetch="intent"
						to={{
							pathname: '/login',
							search: searchParams.toString(),
						}}
					>
						Log in
					</Link>
				</Button>
			</p>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
