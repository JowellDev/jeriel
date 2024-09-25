import { Button } from '~/components/ui/button'

export const Views = {
	CULTE: 'CULTE',
	SERVICE: 'SERVICE',
	STAT: 'STAT',
}

export type ViewOption = keyof typeof Views

export const VIEWS_OPTIONS: { id: ViewOption; label: string }[] = [
	{
		id: 'CULTE',
		label: 'Culte',
	},
	{
		id: 'SERVICE',
		label: 'Service',
	},
	{
		id: 'STAT',
		label: 'Statistiques',
	},
]

interface ViewButtonsProps {
	activeView: ViewOption
	setView?: (view: ViewOption) => void
	excludeOptions?: ViewOption[]
}

export const ViewButtons = ({
	activeView,
	setView,
	excludeOptions = [],
}: Readonly<ViewButtonsProps>) => {
	return (
		<div className="mr-2">
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
						onClick={() => setView?.(id)}
					>
						{label}
					</Button>
				),
			)}
		</div>
	)
}
