import { TableToolbar, type TableToolbarProps } from './table-toolbar'

interface Props extends TableToolbarProps {
	title: string
}

export function StatsToolbar({
	title,
	view,
	setView,
	onSearch,
	onExport,
	views,
}: Readonly<Props>) {
	return (
		<div className="flex flex-col sm:flex-row items-center justify-between">
			<h1 className="w-full sm:w-auto mb-2 sm:mb-0 text-lg sm:text-xl font-bold text-[#226C67]">
				{title}
			</h1>
			<div className="w-full sm:w-[60%]">
				<TableToolbar
					excludeOptions={['STAT']}
					view={view}
					setView={setView}
					onSearch={onSearch}
					onExport={onExport}
					views={views}
				/>
			</div>
		</div>
	)
}
