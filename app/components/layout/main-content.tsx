import type { PropsWithChildren, ReactNode } from 'react'
import { ScrollArea } from '../ui/scroll-area'

type Props = PropsWithChildren<{
	headerChildren?: ReactNode
}>

export function MainContent({ children, headerChildren }: Readonly<Props>) {
	return (
		<div className="flex-1 bg-gray-100 flex flex-col">
			{headerChildren}
			<ScrollArea className="flex-1 mx-4 overflow-y-auto bg-white p-4">
				{children}
			</ScrollArea>
		</div>
	)
}
