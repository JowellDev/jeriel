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
		<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:p-4 p-8 bg-card shadow-sm border-b border-border">
			<div className="flex items-center gap-2">
				{isDesktop && <SidebarTrigger className="text-primary" />}
				{title && (
					<div className={`flex flex-col ${userName ? '-mt-1' : ''}`}>
						<h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0 mt-[0.7rem] sm:mt-0 ml-6 sm:ml-0 text-primary">
							{title}
						</h1>
						{userName && (
							<div className="text-xs -mt-1">
								Bonjour,<span className="font-semibold"> {userName}</span>
							</div>
						)}
					</div>
				)}
			</div>
			<div
				className={`${!title && 'w-full'} flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:space-x-2`}
			>
				{children}
			</div>
		</div>
	)
}
