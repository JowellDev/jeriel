import type { MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import actionFn from './action'
import { JoinForm } from './components/join-form'
import { LoginLink } from './components/login-link'
import loaderFn from './loader'

export const loader = loaderFn

export const action = actionFn

export const meta: MetaFunction = () => [{ title: 'Sign Up' }]

export default function Join() {
	return (
		<div className="flex min-h-full flex-col justify-center">
			<div className="mx-auto w-full max-w-md px-8">
				<Title className="text-xl mb-16" underlined>
					Join us
				</Title>

				<JoinForm />
				<LoginLink />
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
