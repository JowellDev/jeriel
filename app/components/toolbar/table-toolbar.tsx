import {
	RiFileDownloadLine,
	RiFileExcel2Line,
	RiFilterLine,
} from '@remixicon/react'
import { Button } from '../ui/button'
import { InputSearch } from '../form/input-search'
import {
	DEFAULT_VIEWS_OPTIONS,
	type View,
	ViewTabs,
	type ViewOption,
} from './view-buttons'
import { useMediaQuery } from 'usehooks-ts'
import { MOBILE_WIDTH } from '../../shared/constants'
import { cn } from '~/utils/ui'
import MonthPicker from '../form/month-picker'
import { type DateRange } from 'react-day-picker'

export interface TableToolbarProps {
	view?: ViewOption
	excludeOptions?: ViewOption[]
	views?: View[]
	setView?: (view: ViewOption) => void
	onSearch?: (query: string) => void
	onExport?: () => void
	onFilter?: () => void
	onDateSelect?: (range: DateRange) => void
	onPeriodChange?: (range: DateRange) => void
	searchContainerClassName?: string
	align?: 'start' | 'end'
	searchQuery?: string
	searchInputPlaceholder?: string
	isExporting?: boolean
	canExport?: boolean
}

export function TableToolbar({
	view,
	setView,
	onSearch,
	onExport,
	onFilter,
	onDateSelect,
	onPeriodChange,
	excludeOptions,
	searchContainerClassName,
	align,
	searchQuery,
	searchInputPlaceholder,
	views = DEFAULT_VIEWS_OPTIONS,
	isExporting,
	canExport,
}: Readonly<TableToolbarProps>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	const card = `rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50`

	return (
		<div
			className={cn(
				'w-full flex flex-col space-y-2 sm:space-y-0 items-center justify-between sm:flex-row sm:p-2',
				isDesktop ? card : '',
			)}
		>
			{view && (
				<div
					className={cn('w-full flex items-center p-2', isDesktop ? '' : card)}
				>
					<ViewTabs
						options={views}
						activeView={view}
						setView={setView}
						excludeOptions={excludeOptions}
					/>
				</div>
			)}
			<div
				className={cn(
					'w-full flex items-center space-x-2 sm:space-x-4 p-2',
					isDesktop ? '' : (onSearch || onFilter || onExport) && card,
					align && `justify-${align}`,
				)}
			>
				{onSearch && (
					<div className={cn('w-full', searchContainerClassName)}>
						<InputSearch
							onSearch={onSearch}
							defaultValue={searchQuery}
							placeholder={searchInputPlaceholder ?? 'Recherche...'}
						/>
					</div>
				)}
				<div className="flex justify-end items-center space-x-2 sm:space-x-4">
					{onFilter && (
						<Button
							size={isDesktop ? 'sm' : 'icon'}
							variant={isDesktop ? 'outline' : 'secondary'}
							className={cn(
								isDesktop && 'flex items-center space-x-2 border-input',
							)}
							onClick={onFilter}
						>
							<span className="hidden sm:block">Filtrer</span>
							<RiFilterLine size={20} />
						</Button>
					)}

					{onExport && (
						<Button
							size={isDesktop ? 'sm' : 'icon'}
							variant={isDesktop ? 'outline' : 'secondary'}
							className={cn(
								isDesktop && 'flex items-center space-x-2 border-input',
							)}
							onClick={onExport}
							disabled={isExporting || !canExport}
						>
							<span className="hidden sm:block">
								{isExporting ? 'En cours...' : 'Exporter'}
							</span>
							{isExporting ? (
								<RiFileDownloadLine className="animate-bounce" size={20} />
							) : (
								<RiFileExcel2Line size={20} />
							)}
						</Button>
					)}
					{onDateSelect && onPeriodChange && (
						<MonthPicker
							onChange={onPeriodChange}
							isDesktop={isDesktop ? false : true}
							className="min-w-fit items-center"
						/>
					)}
				</div>
			</div>
		</div>
	)
}
