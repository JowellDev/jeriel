import { type MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import { BackToLoginLink } from './components/back-to-login-link'
import { PasswordForgottenForm } from './components/password-forgotten-form'
import { actionFn } from './action.server'
import { loaderFn } from './loader.server'

export const loader = loaderFn

export const action = actionFn

export const meta: MetaFunction = () => [{ title: 'Password Forgotten' }]

export default function PasswordForgottenPage() {
	return (
		<div className="flex min-h-full flex-col justify-center">
			<div className="mx-auto w-full max-w-md px-8">
				<Title className="text-xl mb-16" underlined>
					Password forgotten
				</Title>

				<PasswordForgottenForm />

				<BackToLoginLink />
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
