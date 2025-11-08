import type { MetaFunction } from '@remix-run/node'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Title } from '~/components/title'
import { BackToLoginLink } from '../password-forgotten+/components/back-to-login-link'
import { loaderFn } from './loader.server'
import { Link } from '@remix-run/react'

export const meta: MetaFunction = () => [{ title: "Vérification d'OTP" }]

export const loader = loaderFn

export default function VerifyPage() {
	return (
		<div className="flex flex-col w-full space-y-4 justify-center">
			<Title className="text-[1.4rem] text-center text-[#226C67] font-semibold normal-case">
				Lien de réinitialisation invalide
			</Title>
			<div className="grid grid-cols-1 gap-y-5 text-center">
				<p className="text-muted-foreground">
					Le lien de réinitialisation est incorrect ou a expiré. Veuillez en
					demander un nouveau.
				</p>

				<p className="text-muted-foreground">
					vous pouvez{' '}
					<Link to="/password-forgotten" className="text-primary">
						demander un lien de réinitialisation
					</Link>
				</p>
			</div>
			<BackToLoginLink />
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
