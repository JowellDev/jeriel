import { useEffect, useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'

import { MOBILE_WIDTH } from '~/shared/constants'

import { ScrollArea } from '../ui/scroll-area'

type Props = {
	headerChildren?: React.ReactNode
	children: React.ReactNode
}

export function MainContent({ children, headerChildren }: Readonly<Props>) {
	const [isMounted, setIsMounted] = useState(false)

	useEffect(() => {
		setIsMounted(true)
	}, [])

	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	return (
		<div className="flex-1 bg-muted flex flex-col h-full">
			{headerChildren}
			{isMounted ? (
				isDesktop ? (
					<ScrollArea className="flex-1 overflow-x-hidden bg-muted px-4 pb-4">
						{children}
					</ScrollArea>
				) : (
					<div className="h-full w-full bg-muted overflow-auto px-2 pt-2 pb-4">
						{children}
					</div>
				)
			) : null}
		</div>
	)
}
