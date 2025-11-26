import { useState } from 'react'
import { RiFileExcel2Line, RiFilterLine } from '@remixicon/react'
import { useMediaQuery } from 'usehooks-ts'

import { Button } from '~/components/ui/button'
import { InputSearch } from '~/components/form/input-search'
import { MOBILE_WIDTH } from '~/shared/constants'
import { cn } from '~/utils/ui'

import { VIEWS } from '../../types'
import { ViewButtons } from '../views-buttons'

interface Props {
	searchQuery: string
	align?: 'start' | 'end'
	onSearch: (query: string) => void
	onFilter: () => void
	onExport: () => void
}

export function StatHeader({
	onSearch,
	onFilter,
	onExport,
	align,
	searchQuery,
}: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const card = `rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50`

	const [view, setView] = useState<keyof typeof VIEWS>('CULTE')

	return (
		<div
			className={cn(
				isDesktop &&
					'flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:p-4 p-8 bg-white shadow-sm border border-zinc-200 rounded-md',
			)}
		>
			{!isDesktop && (
				<h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0 mt-[3.5rem] sm:mt-0 sm:ml-0 text-[#226C67]">
					Suivi des nouveaux fidèles
				</h1>
			)}
			<div className="text-sm flex items-center space-x-2">
				{isDesktop && (
					<h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0 mt-[3.5rem] sm:mt-0 ml-6 sm:ml-0 text-[#226C67]">
						Suivi des nouveaux fidèles
					</h1>
				)}

				{isDesktop && (
					<ViewButtons
						activeView={view}
						setView={setView}
						excludeOptions={[VIEWS.STAT]}
					/>
				)}
			</div>

			<div
				className={cn(
					'flex items-center space-x-2 sm:space-x-4 p-2',
					isDesktop ? 'w-1/2' : card,
					align && `justify-${align}`,
				)}
			>
				{!isDesktop && (
					<ViewButtons
						activeView={view}
						setView={setView}
						excludeOptions={[VIEWS.STAT]}
					/>
				)}
				<div className={`${isDesktop ? 'w-full' : 'w-full'}`}>
					<InputSearch
						className="w-full"
						onSearch={onSearch}
						defaultValue={searchQuery}
						placeholder="Recherche..."
					/>
				</div>

				<Button
					size={isDesktop ? 'sm' : 'icon'}
					variant={isDesktop ? 'outline' : 'secondary'}
					className={cn(
						isDesktop
							? 'flex items-center space-x-2 border-input'
							: 'min-w-[30px]',
					)}
					onClick={onFilter}
				>
					<span className="hidden sm:block">Filtrer</span>
					<RiFilterLine size={20} />
				</Button>
				<Button
					size={isDesktop ? 'sm' : 'icon'}
					variant={isDesktop ? 'outline' : 'secondary'}
					className={cn(
						isDesktop
							? 'flex items-center space-x-2 border-input'
							: 'min-w-[30px]',
					)}
					onClick={onExport}
				>
					<span className="hidden sm:block">Exporter</span>
					<RiFileExcel2Line size={20} />
				</Button>
			</div>
		</div>
	)
}
