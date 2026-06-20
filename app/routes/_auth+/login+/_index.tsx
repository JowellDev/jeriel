import type { MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { LoginForm } from './components/login-form'
import { actionFn } from './action.server'
import { useLoaderData, useNavigation } from '@remix-run/react'
import { loaderFn, type LoaderType } from './loader.server'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const action = actionFn
export const loader = loaderFn

export const meta: MetaFunction = () => [{ title: 'Connexion | Jeriel' }]

export default function LoginPage() {
	const { message } = useLoaderData<LoaderType>()
	const navigation = useNavigation()

	useEffect(() => {
		if (navigation.state === 'idle' && message) {
			toast.success(message)
		}
	}, [navigation, message])

	return (
		<div className="flex w-full flex-col space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold text-foreground">Bienvenue 👋</h1>
				<p className="text-sm text-muted-foreground">
					Connectez-vous pour accéder à votre espace.
				</p>
			</div>
			<LoginForm />
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
