import { useState } from 'react'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import {
	RiBuilding4Line,
	RiLockPasswordLine,
	RiMailLine,
	RiPhoneLine,
	type RemixiconComponentType,
} from '@remixicon/react'

import { GeneralErrorBoundary } from '~/components/error-boundary'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import type { AuthenticatedUser } from '~/utils/auth.server'

import { PasswordUpdateForm } from './components/password-update-form'
import { getTranslatedUserRole } from './utils'
import { actionFn } from './action.server'
import { loaderFn, type LoaderType } from './loader.server'

export const action = actionFn

export const loader = loaderFn

export const meta: MetaFunction = () => [{ title: 'Jeriel | Mon compte' }]

function getInitials(name?: string | null) {
	if (!name) return '?'
	return name
		.split(' ')
		.slice(0, 2)
		.map(part => part[0])
		.join('')
		.toUpperCase()
}

export default function Account() {
	const { currentUser } = useLoaderData<LoaderType>()
	const user = currentUser as unknown as AuthenticatedUser
	const [showForm, setShowForm] = useState(false)

	const role = getTranslatedUserRole(user)

	return (
		<MainContent>
			<div className="flex min-h-full justify-center px-4 py-8">
				<Card className="w-full max-w-2xl overflow-hidden rounded-xl p-0 shadow-md">
					{/* Bannière */}
					<div className="h-28 bg-gradient-to-br from-primary to-primary/75" />

					<div className="px-6 pb-8 sm:px-8">
						{/* En-tête profil */}
						<div className="-mt-12 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
							<Avatar className="h-24 w-24 border-4 border-card shadow-sm">
								<AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
									{getInitials(user.name)}
								</AvatarFallback>
							</Avatar>
							<div className="flex flex-1 flex-col items-center sm:mb-2 sm:items-start">
								<h1 className="text-2xl font-bold text-foreground">
									{user.name ?? 'N/D'}
								</h1>
								<Badge variant="primary" className="mt-1">
									{role}
								</Badge>
							</div>
							<Button
								type="button"
								variant="outline"
								className="sm:mb-2"
								onClick={() => setShowForm(!showForm)}
							>
								<RiLockPasswordLine size={18} className="mr-2" />
								Modifier le mot de passe
							</Button>
						</div>

						{/* Coordonnées */}
						<div className="mt-8 grid gap-4 sm:grid-cols-2">
							<InfoRow Icon={RiMailLine} label="E-mail" value={user.email} />
							<InfoRow
								Icon={RiPhoneLine}
								label="Téléphone"
								value={user.phone}
							/>
							<InfoRow
								Icon={RiBuilding4Line}
								label="Rôle"
								value={role}
								className="sm:col-span-2"
							/>
						</div>
					</div>
				</Card>
				{showForm && <PasswordUpdateForm onClose={() => setShowForm(false)} />}
			</div>
		</MainContent>
	)
}

function InfoRow({
	Icon,
	label,
	value,
	className,
}: Readonly<{
	Icon: RemixiconComponentType
	label: string
	value?: string | null
	className?: string
}>) {
	return (
		<div
			className={`flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 ${className ?? ''}`}
		>
			<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<Icon size={20} />
			</span>
			<div className="min-w-0">
				<p className="text-xs text-muted-foreground">{label}</p>
				<p className="truncate font-medium text-foreground">{value ?? 'N/D'}</p>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
