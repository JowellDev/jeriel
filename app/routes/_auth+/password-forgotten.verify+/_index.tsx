import type { MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import { VerifyForm } from './components/verify-form'
import { BackToLoginLink } from '../password-forgotten+/components/back-to-login-link'
import { actionFn } from './action.server'
import { loaderFn } from './loader.server'

export const meta: MetaFunction = () => [{ title: 'Vérification' }]

export const action = actionFn
export const loader = loaderFn

export default function VerifyPage() {
	return (
		<div className="flex flex-col w-full space-y-4 justify-center">
			<Title className="text-[1.4rem] text-center text-[#226C67] font-semibold normal-case">
				Vérification
			</Title>
			<VerifyForm />
			<BackToLoginLink />
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
