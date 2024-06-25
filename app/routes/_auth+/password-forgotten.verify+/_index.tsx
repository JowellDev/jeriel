import type { MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import actionFn from './action'
import { VerifyForm } from './components/verify-form'
import loaderFn from './loader'

export const meta: MetaFunction = () => [{ title: 'Verify Your Email' }]

export const loader = loaderFn

export const action = actionFn

export default function VerifyPage() {
	return (
		<div className="flex min-h-full flex-col justify-center">
			<div className="mx-auto w-full max-w-sm px-8">
				<Title className="text-xl mb-16" underlined>
					Verify your email
				</Title>

				<VerifyForm />
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
