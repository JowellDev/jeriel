import { useState, type PropsWithChildren } from 'react'
import { ViewButtons } from '../views-buttons'
import { VIEWS } from '../../types'
import { InputSearch } from '~/components/form/input-search'

type Props = {
	searchQuery: string
	onSearch: (query: string) => void
	onFilter: (query: string) => void
	onExport: () => void
}

export function StatHeader({
	onSearch,
	onFilter,
	onExport,
	searchQuery,
}: Readonly<Props>) {
	const [view, setView] = useState<keyof typeof VIEWS>('CULTE')

	return (
		<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:p-4 p-8 bg-white shadow-sm border border-zinc-200 rounded-md">
			<div className="text-sm flex items-center space-x-2">
				<h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0 mt-[3.5rem] sm:mt-0 ml-6 sm:ml-0 text-[#226C67]">
					Suivi des nouveaux fidèles
				</h1>

				<ViewButtons
					activeView={view}
					setView={setView}
					excludeOptions={[VIEWS.STAT]}
				/>
			</div>

			<div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:space-x-2">
				<InputSearch
					onSearch={onSearch}
					defaultValue={searchQuery}
					placeholder="Recherche..."
				/>
			</div>
		</div>
	)
}
