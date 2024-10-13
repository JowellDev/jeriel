import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { actionFn } from './action.server'
import { Card } from '~/components/ui/card'
import { Header } from './components/header'
import { Button } from '~/components/ui/button'
import { TableToolbar } from '~/components/toolbar'
import { RiArrowDownSLine } from '@remixicon/react'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'
import { MemberFormDialog } from './components/member-form'
import { UploadFormDialog } from './components/upload-form'
import { type LoaderData, loaderFn } from './loader.server'
import { HonorFamilyMembersTable } from './components/table'
import { MainContent } from '~/components/layout/main-content'
import { AssistantFormDialog } from './components/assistant-form'
import { speedDialItems, speedDialItemsActions } from './constants'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import type { Member, MemberWithMonthlyAttendances } from './types'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import { useHonorFamilyDetails } from './hooks/use-honor-family-details'
import { FilterFormDialog } from './components/filter-form'
import { Statistics } from './components/statistics/statistics'
import { motion, AnimatePresence } from 'framer-motion'
import { StatHeader } from './components/statistics/stat-header'

export const meta: MetaFunction = () => [
	{ title: 'Membres de la famille d’honneur' },
]

export const loader = loaderFn
export const action = actionFn

export default function HonorFamily() {
	const loaderData = useLoaderData<LoaderData>()

	const {
		data: { honorFamily, filterData },
		view,
		setView,
		searchParams,
		openManualForm,
		setOpenManualForm,
		openUploadForm,
		setOpenUploadForm,
		openAssistantForm,
		setOpenAssistantForm,
		openFilterForm,
		setOpenFilterForm,
		handleFilterChange,
		handleClose,
		handleSearch,
		handleShowMoreTableData,
		membersOption,
	} = useHonorFamilyDetails(loaderData)

	const handleSpeedDialItemClick = (action: string) => {
		switch (action) {
			case speedDialItemsActions.CREATE_MEMBER:
				return setOpenManualForm(true)
			case speedDialItemsActions.UPLOAD_MEMBERS:
				return setOpenUploadForm(true)
			default:
				break
		}
	}

	function onFilter() {
		setOpenFilterForm(true)
	}

	function onExport() {
		//
	}

	return (
		<MainContent
			headerChildren={
				<Header
					name={honorFamily.name}
					managerName={honorFamily.manager.name}
					membersCount={honorFamily._count.members}
					assistants={honorFamily.assistants as unknown as Member[]}
					onOpenAssistantForm={() => setOpenAssistantForm(true)}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="hidden sm:flex items-center" variant={'gold'}>
								<span>Ajouter un fidèle</span>
								<RiArrowDownSLine size={20} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mr-3 ">
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setOpenManualForm(true)}
							>
								Ajouter manuellement
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setOpenUploadForm(true)}
							>
								Importer un fichier
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</Header>
			}
		>
			<div className="space-y-2 mb-4">
				<TableToolbar
					view={view}
					searchQuery={searchParams.get('query') || ''}
					setView={setView}
					onSearch={view !== 'STAT' ? handleSearch : undefined}
					onFilter={view !== 'STAT' ? onFilter : undefined}
					onExport={view !== 'STAT' ? onExport : undefined}
				/>
			</div>

			<div className="space-y-4">
				<AnimatePresence>
					{view === 'STAT' && (
						<motion.div
							key="stats"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{
								type: 'spring',
								stiffness: 300,
								damping: 30,
								height: {
									duration: 0.4,
								},
							}}
							className="overflow-x-visible"
						>
							<Statistics />
						</motion.div>
					)}
				</AnimatePresence>

				<motion.div
					layout
					key="table"
					initial={false}
					animate={{ opacity: 1 }}
					transition={{
						layout: { type: 'spring', stiffness: 300, damping: 30 },
					}}
				>
					{view === 'STAT' && (
						<div className="space-y-2 mb-4">
							<StatHeader
								searchQuery={searchParams.get('query') ?? ''}
								onSearch={handleSearch}
								onFilter={onFilter}
								onExport={onExport}
							/>
						</div>
					)}

					<Card className="space-y-2 mb-4">
						<HonorFamilyMembersTable
							data={
								honorFamily.members as unknown as MemberWithMonthlyAttendances[]
							}
						/>
						{honorFamily.total > DEFAULT_QUERY_TAKE && (
							<div className="flex justify-center pb-2">
								<Button
									size="sm"
									type="button"
									variant="ghost"
									className="bg-neutral-200 rounded-full"
									onClick={handleShowMoreTableData}
									disabled={filterData.take >= honorFamily.total}
								>
									Voir plus
								</Button>
							</div>
						)}
					</Card>
				</motion.div>
			</div>

			{openFilterForm && (
				<FilterFormDialog
					filterData={filterData}
					onClose={handleClose}
					onFilter={handleFilterChange}
				/>
			)}

			{openManualForm && (
				<MemberFormDialog
					onClose={handleClose}
					honorFamilyId={honorFamily.id}
				/>
			)}

			{openUploadForm && <UploadFormDialog onClose={handleClose} />}

			{openAssistantForm && (
				<AssistantFormDialog
					onClose={handleClose}
					honorFamilyId={honorFamily.id}
					membersOption={membersOption}
				/>
			)}

			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
