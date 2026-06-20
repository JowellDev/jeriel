import { type PropsWithChildren } from 'react'
import { useMediaQuery } from 'usehooks-ts'

import { MOBILE_WIDTH } from '~/shared/constants'
import { SidebarTrigger } from '~/components/ui/sidebar'

type Props = PropsWithChildren<{
	title?: string
	userName?: string
}>

export function Header({ children, title, userName }: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	return (
		<div className="mb-4 flex flex-col border-b border-border bg-card py-4 pl-14 pr-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:pl-4">
			<div className="flex min-h-10 items-center gap-2 sm:min-h-0">
				{isDesktop && <SidebarTrigger className="shrink-0 text-primary" />}
				{title && (
					<div className="flex flex-col justify-center">
						<h1 className="text-lg font-bold leading-tight text-primary sm:text-xl">
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
			<div
				className={`${!title ? 'w-full' : ''} mt-3 flex flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center sm:space-x-2`}
			>
				{children}
			</div>
		</div>
	)
}
