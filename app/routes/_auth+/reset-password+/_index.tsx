import type { MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import { ResetPasswordForm } from './components/reset-password-form'
import { actionFn } from './action.server'
import { loaderFn } from './loader.server'

export const meta: MetaFunction = () => [{ title: 'Reset Your Password' }]

export const loader = loaderFn

export const action = actionFn

export default function ResetPasswordPage() {
	return (
		<div className="flex min-h-full flex-col justify-center">
			<div className="mx-auto w-full max-w-sm px-8">
				<Title className="mb-16" underlined>
					Reset Your Password
				</Title>

				<ResetPasswordForm />
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
