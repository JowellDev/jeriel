import { useState } from 'react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { AccountDetails } from './components/account-details'
import { PasswordUpdateForm } from './components/password-update-form'
import { actionFn } from './action.server'
import { loaderFn, type LoaderType } from './loader.server'
import { useFetcher, useLoaderData } from '@remix-run/react'

export const action = actionFn

export const loader = loaderFn

export default function Account() {
	const { user } = useLoaderData<LoaderType>()
	const [showForm, setShowForm] = useState(false)

	const fetcher = useFetcher()

	const handleTest = () => {
		fetcher.submit(
			{},
			{ method: 'post', action: '/api/birthday-notifications' },
		)
	}

	return (
		<MainContent>
			<div className="flex h-screen justify-center items-center">
				<Card className="w-full md:w-[600px] md:mx-auto border-none rounded p-8 text-[#424242] space-y-8">
					<CardTitle className="text-center md:text-start text-2xl">
						Mon compte
					</CardTitle>
					<div className="flex flex-col space-y-4 justify-center items-center md:flex-row md:space-x-6 mt-4">
						<img src="/images/account.svg" alt="Account" />
						<div className="flex flex-col justify-center items-center md:justify-start md:items-start space-y-2">
							<AccountDetails user={user} />
							<Separator />
							<div>
								<Button
									className="mt-4"
									type="button"
									variant="outline"
									onClick={() => setShowForm(!showForm)}
								>
									Modifier mon mot de passe
								</Button>
							</div>
						</div>
					</div>
				</Card>
				{showForm && <PasswordUpdateForm onClose={() => setShowForm(false)} />}

				<Card className="w-full md:w-[600px] md:mx-auto border-none rounded p-8 text-[#424242] space-y-8">
					<CardTitle className="text-center md:text-start text-2xl">
						Anniversaires
					</CardTitle>
					<div className="p-4 border rounded-lg">
						<h3 className="text-lg font-semibold mb-2">
							Test des notifications d'anniversaires
						</h3>
						<p className="text-sm text-gray-600 mb-4">
							Lance manuellement le processus de notification des anniversaires
							pour la semaine à venir.
						</p>

						<Button
							onClick={handleTest}
							disabled={fetcher.state === 'submitting'}
							className="mb-2"
						>
							{fetcher.state === 'submitting'
								? 'Envoi en cours...'
								: 'Tester les notifications'}
						</Button>

						{fetcher.data?.success && (
							<div className="text-green-600 text-sm">
								✅ {fetcher.data.message}
							</div>
						)}

						{fetcher.data?.error && (
							<div className="text-red-600 text-sm">
								❌ {fetcher.data.error}
							</div>
						)}
					</div>
				</Card>
			</div>
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
