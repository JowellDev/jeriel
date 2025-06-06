import { useEffect, useState } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { useMediaQuery } from 'usehooks-ts'
import { MOBILE_WIDTH } from '~/shared/constants'

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
		<div className="flex-1 bg-gray-100 flex flex-col h-full">
			{headerChildren}
			{isMounted ? (
				isDesktop ? (
					<ScrollArea className="flex-1 overflow-y-auto bg-[#F6F6F6] px-4 pb-4">
						{children}
					</ScrollArea>
				) : (
					<div className="h-full w-full bg-[#F6F6F6] overflow-auto px-2 pt-2 pb-4">
						{children}
					</div>
				)
			) : null}
		</div>
	)
}
