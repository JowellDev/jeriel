import { useState } from 'react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { AccountDetails } from './components/account-details'

export default function Account() {
	const [showForm, setShowForm] = useState(false)

	return (
		<MainContent>
			<div className="flex h-[100vh] flex-col justify-center p-2">
				<Card className="w-full md:w-[600px] md:mx-auto border-none rounded p-8 text-[#424242] space-y-8">
					<CardTitle className="text-center md:text-start text-2xl">
						Mon compte
					</CardTitle>
					<div className="flex flex-col space-y-4 justify-center items-center md:flex-row md:space-x-6 mt-4">
						<img src="/images/account.svg" alt="Account" />
						<div className="flex flex-col justify-center items-center md:justify-start md:items-start space-y-2">
							<AccountDetails />
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
			</div>
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
