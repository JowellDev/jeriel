import {
	type MetaFunction,
	useFetcher,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { useCallback, useEffect, useState } from 'react'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { type LoaderData, loaderFn } from './loader.server'
import type { Member, MemberWithMonthlyAttendances } from './types'
import { Views } from './types'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import { RiArrowDownSLine, RiFileExcel2Line } from '@remixicon/react'
import { SelectInput } from '~/components/form/select-input'
import { speedDialItems, speedDialItemsActions } from './constants'
import { HonorFamilyMembersTable } from './components/table'
import { AssistantFormDialog } from './components/assistant-form'
import { actionFn } from './action.server'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { MemberFormDialog } from './components/member-form'
import { UploadFormDialog } from './components/upload-form'
import { Header } from './components/header'
import { TableToolbar } from '~/components/toolbar'
import { useHonorFamilyDetails } from './hooks/use-honor-family-details'

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
		statView,
		setStatView,
		openManualForm,
		setOpenManualForm,
		openUploadForm,
		setOpenUploadForm,
		openAssistantForm,
		setOpenAssistantForm,
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
		//
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
					{(view === 'CULTE' || view === 'SERVICE') && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									className="hidden sm:flex items-center"
									variant={'gold'}
								>
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
					)}
				</Header>
			}
		>
			<div className="space-y-2 mb-4">
				<TableToolbar
					view={view}
					setView={setView}
					onSearch={view !== 'STAT' ? handleSearch : undefined}
					onFilter={view !== 'STAT' ? onFilter : undefined}
					onExport={view !== 'STAT' ? onExport : undefined}
				/>
			</div>

			{(view === 'CULTE' || view === 'SERVICE') && (
				<Card className="space-y-2 pb-4 mb-2">
					<HonorFamilyMembersTable
						data={
							honorFamily.members as unknown as MemberWithMonthlyAttendances[]
						}
					/>
					{honorFamily._count.members > DEFAULT_QUERY_TAKE && (
						<div className="flex justify-center">
							<Button
								size="sm"
								type="button"
								variant="ghost"
								className="bg-neutral-200 rounded-full"
								onClick={handleShowMoreTableData}
								disabled={filterData.take >= honorFamily._count.members}
							>
								Voir plus
							</Button>
						</div>
					)}
				</Card>
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
