import type { MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import { LoginForm } from './components/login-form'
import { actionFn } from './action.server'

export const action = actionFn

export const meta: MetaFunction = () => [{ title: 'Connexion' }]

export default function LoginPage() {
	return (
		<div className="flex flex-col w-full space-y-4 justify-center">
			<Title className="text-[1.4rem] text-center text-[#226C67] font-semibold">
				Connexion
			</Title>
			<LoginForm />
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
