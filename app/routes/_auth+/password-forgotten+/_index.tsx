import { type MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import { BackToLoginLink } from './components/back-to-login-link'
import { PasswordForgottenForm } from './components/password-forgotten-form'
import { actionFn } from './action.server'

export const action = actionFn

export const meta: MetaFunction = () => [{ title: 'Mot de passe oublié' }]

export default function PasswordForgottenPage() {
	return (
		<div className="flex flex-col w-full space-y-4 justify-center">
			<Title className="text-[1.8rem] text-center text-[#226C67] font-semibold normal-case">
				Mot de passe oublié
			</Title>
			<PasswordForgottenForm />
			<BackToLoginLink />
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
