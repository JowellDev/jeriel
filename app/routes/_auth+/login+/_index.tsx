import type { MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import actionFn from './action'
import { CreateAccountLink } from './components/create-account-link'
import { LoginForm } from './components/login-form'
import loaderFn from './loader'

export const loader = loaderFn

export const action = actionFn

export const meta: MetaFunction = () => [{ title: 'Login' }]

export default function LoginPage() {
	return (
		<div className="flex min-h-full flex-col justify-center">
			<div className="mx-auto w-full max-w-md px-8">
				<Title className="text-xl mb-16" underlined>
					Log in
				</Title>

				<LoginForm />
				<CreateAccountLink />
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
