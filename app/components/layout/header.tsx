import { type PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
	title: string
}>

export function Header({ children, title }: Readonly<Props>) {
	return (
		<div className="flex justify-between items-center mb-4 p-4 bg-white">
			<h1 className="text-xl font-bold">{title}</h1>
			<div className="flex items-center space-x-2">{children}</div>
		</div>
	)
}
