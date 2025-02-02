import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { type MetaFunction } from '@remix-run/node'
import { TableToolbar } from '~/components/toolbar'
import { DropdownMenuComponent } from '~/shared/tribe/dropdown-menu'
import { loaderFn } from './loader.server'
import { useLoaderData } from '@remix-run/react'
import { useHonorFamily } from './hooks/use-honor-family'

export const meta: MetaFunction = () => [{ title: "Famille d'honneur" }]

export const loader = loaderFn

export default function HonorFamily() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		view,
		setView,
		handleSearch,
		handleOnExport,
		setOpenFilterForm,
		setOpenCreateForm,
		setOpenUploadForm,
		setOpenAttendanceForm,
	} = useHonorFamily(loaderData)

	return (
		<MainContent
			headerChildren={
				<Header title="Famille d'honneur">
					<DropdownMenuComponent
						onOpenManuallyForm={() => setOpenCreateForm(true)}
						onOpenUploadForm={() => setOpenUploadForm(true)}
						variant={'outline'}
						classname="border-input"
					/>
					<Button
						className="hidden sm:block"
						variant={'primary'}
						onClick={() => setOpenAttendanceForm(true)}
					>
						Marquer la présence
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="space-y-2 mb-4">
					<TableToolbar
						view={view}
						excludeOptions={['STAT']}
						setView={setView}
						onSearch={handleSearch}
						onFilter={() => setOpenFilterForm(true)}
						onExport={handleOnExport}
					/>
				</div>
				<Card className="space-y-2 pb-4 mb-2">
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
		</MainContent>
	)
}
