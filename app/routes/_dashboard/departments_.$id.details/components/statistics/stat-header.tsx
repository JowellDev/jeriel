import { type PropsWithChildren } from 'react'
import { ViewButtons } from '../views-buttons'
import { type ViewOption } from '../../models'

type Props = PropsWithChildren<{
	title: string
	view: ViewOption
	setView: (view: ViewOption) => void
}>

export function StatHeader({
	title,
	children,
	view,
	setView,
}: Readonly<Props>) {
	return (
		<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:p-4 p-8 bg-white shadow">
			<div className="text-sm flex items-center space-x-2">
				<h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0 mt-[3.5rem] sm:mt-0 ml-6 sm:ml-0 text-[#226C67]">
					{title}
				</h1>

				<ViewButtons
					activeView={view}
					setView={setView}
					excludeOptions={['stat']}
				/>
			</div>

			<div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:space-x-2">
				{children}
			</div>
		</div>
	)
}
