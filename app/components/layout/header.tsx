import { type PropsWithChildren } from 'react'
import { RiArrowLeftLine } from '@remixicon/react'
import { useMediaQuery } from 'usehooks-ts'

import { MOBILE_WIDTH } from '~/shared/constants'
import { useRouteMatcher } from '~/utils/match'
import { Button } from '~/components/ui/button'
import { SidebarTrigger } from '~/components/ui/sidebar'

type Props = PropsWithChildren<{
	title?: string
	userName?: string
	onBack?: () => void
}>

export function Header({ children, title, userName, onBack }: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	// Les routes /details n'affichent pas le menu mobile flottant : pas besoin de
	// réserver l'espace à gauche pour le hamburger.
	const isDetailsRoute = useRouteMatcher('/details')

	return (
		<div
			className={`mb-4 flex flex-col border-b border-border bg-card py-4 pr-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:pl-4 ${
				isDetailsRoute ? 'pl-4' : 'pl-14'
			}`}
		>
			<div className="flex min-h-10 items-center gap-2 sm:min-h-0">
				{isDesktop && <SidebarTrigger className="shrink-0 text-primary" />}
				{onBack && (
					<Button
						variant="ghost"
						size={isDesktop ? 'sm' : 'icon'}
						className="shrink-0 space-x-1"
						onClick={onBack}
					>
						<RiArrowLeftLine size={20} />
						{isDesktop && <span>Retour</span>}
					</Button>
				)}
				{title && (
					<div className="flex min-w-0 flex-col justify-center">
						<h1 className="truncate text-lg font-bold leading-tight text-primary sm:text-xl">
							{title}
						</h1>
						{userName && (
							<div className="text-xs text-muted-foreground">
								Bonjour,<span className="font-semibold"> {userName}</span>
							</div>
						)}
					</div>
				)}
			</div>
			{children && (
				<div
					className={`${!title && !onBack ? 'w-full' : ''} mt-3 flex flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center sm:space-x-2`}
				>
					{children}
				</div>
			)}
		</div>
	)
}
