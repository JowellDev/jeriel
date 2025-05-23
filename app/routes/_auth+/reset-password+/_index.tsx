import type { MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import { ResetPasswordForm } from './components/reset-password-form'
import { actionFn } from './action.server'
import { loaderFn } from './loader.server'
import { BackToLoginLink } from '../password-forgotten+/components/back-to-login-link'

export const meta: MetaFunction = () => [{ title: 'Reset Your Password' }]

export const loader = loaderFn

export const action = actionFn

export default function ResetPasswordPage() {
	return (
		<div className="flex flex-col w-full space-y-4 justify-center">
			<Title className="text-[1.4rem] text-center text-[#226C67] font-semibold normal-case">
				Réinitialisation du mot de passe
			</Title>
			<ResetPasswordForm />
			<BackToLoginLink />
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
