import type { PropsWithChildren, ReactNode } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { useMediaQuery } from 'usehooks-ts'
import { MOBILE_WIDTH } from './mobile/width'

type Props = PropsWithChildren<{
	headerChildren?: ReactNode
}>

export function MainContent({ children, headerChildren }: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	return (
		<div className="flex-1 bg-gray-100 flex flex-col h-full">
			{headerChildren}
			{isDesktop ? (
				<ScrollArea className="flex-1 mx-2 overflow-y-auto bg-white p-4">
					{children}
				</ScrollArea>
			) : (
				<div className="h-full w-full bg-white overflow-auto p-2">
					{children}
				</div>
			)}
		</div>
	)
}
