import type { PropsWithChildren, ReactNode } from 'react'
import { ScrollArea } from '../ui/scroll-area'

type Props = PropsWithChildren<{
	headerChildren?: ReactNode
}>

export function MainContent({ children, headerChildren }: Readonly<Props>) {
	return (
		<div className="flex-1 bg-gray-100 flex flex-col h-full">
			{headerChildren}
			<ScrollArea className="flex-1 mx-2 sm:mx-4 overflow-auto bg-white pt-4 sm:pt-0 sm:pb-0 pb-4 sm:p-4">
				{children}
			</ScrollArea>
		</div>
	)
}
