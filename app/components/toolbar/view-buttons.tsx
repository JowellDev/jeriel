import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'

export const Views = {
	CULTE: 'CULTE',
	SERVICE: 'SERVICE',
	MEETING: 'MEETING',
	STAT: 'STAT',
	ARCHIVE_REQUEST: 'ARCHIVE_REQUEST',
	REPORTS: 'REPORTS',
	CONFLICTS: 'CONFLICTS',
	ARCHIVE: 'ARCHIVE',
	TRIBE: 'TRIBE',
	DEPARTMENT: 'DEPARTMENT',
}

export type ViewOption = keyof typeof Views

export interface View {
	id: ViewOption
	label: string
}

export const DEFAULT_VIEWS_OPTIONS: View[] = [
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

interface ViewTabsProps {
	activeView: ViewOption
	setView?: (view: ViewOption) => void
	excludeOptions?: ViewOption[]
	options: View[]
}

export const ViewTabs = ({
	activeView,
	setView,
	excludeOptions = [],
	options,
}: Readonly<ViewTabsProps>) => {
	return (
		<Tabs
			value={activeView}
			onValueChange={value => setView?.(value as ViewOption)}
			className="mr-2"
		>
			<TabsList className="w-fit">
				{options
					.filter(({ id }) => !excludeOptions.includes(id))
					.map(({ id, label }) => (
						<TabsTrigger key={id} value={id}>
							{label}
						</TabsTrigger>
					))}
			</TabsList>
		</Tabs>
	)
}
