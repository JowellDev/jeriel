import { Button } from '~/components/ui/button'

import { VIEWS_OPTIONS } from '../constants'
import { type ViewOption } from '../types'

interface ViewButtonsProps {
	activeView: ViewOption
	setView: (view: ViewOption) => void
	excludeOptions?: ViewOption[]
}

export const ViewButtons = ({
	activeView,
	setView,
	excludeOptions = [],
}: Readonly<ViewButtonsProps>) => {
	return (
		<div className="mr-2 flex">
			{VIEWS_OPTIONS.filter(({ id }) => !excludeOptions.includes(id)).map(
				({ id, label }) => (
					<Button
						variant="outline"
						key={id}
						value={id}
						className={`px-4 py-2 border-gray-200 first:rounded-l-sm last:rounded-r-sm rounded-none ${
							activeView === id
								? 'bg-[#687076] text-white'
								: 'bg-[#FFFFFF] text-black'
						}`}
						onClick={() => setView(id)}
					>
						{label}
					</Button>
				),
			)}
		</div>
	)
}
