import { type PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
	title: string
}>

export function Header({ children, title }: Readonly<Props>) {
	return (
		<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 p-4 bg-white">
			<h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0">{title}</h1>
			<div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:space-x-2">
				{children}
			</div>
		</div>
	)
}
