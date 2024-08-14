import type { MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import { LoginForm } from './components/login-form'
import { actionFn } from './action.server'
import { useLoaderData, useNavigation } from '@remix-run/react'
import { loaderFn, type LoaderType } from './loader.server'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const action = actionFn
export const loader = loaderFn

export const meta: MetaFunction = () => [{ title: 'Connexion' }]

export default function LoginPage() {
	const loaderData = useLoaderData<LoaderType>()
	const navigation = useNavigation()

	useEffect(() => {
		if (navigation.state === 'idle' && loaderData.succesMessage) {
			toast.success(loaderData.succesMessage)
		}
	}, [navigation, loaderData.succesMessage])

	return (
		<div className="flex flex-col w-full space-y-4 justify-center">
			<Title className="text-[1.4rem] text-center text-[#226C67] font-semibold normal-case">
				Connexion
			</Title>
			<LoginForm />
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
