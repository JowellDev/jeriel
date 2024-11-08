import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { type MetaFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { TableToolbar } from '~/components/toolbar'
import MemberTable from './components/member-table'
import { loaderFn } from './loader.server'
import { useTribeMembers } from './hooks/use-tribe-members'
import type { MemberMonthlyAttendances } from '~/models/member.model'

export const meta: MetaFunction = () => [{ title: 'Gestion des membres' }]

export const loader = loaderFn

export default function Tribe() {
	const loaderData = useLoaderData<typeof loaderFn>()
	const {
		data,
		currentMounth,
		view,
		setView,
		handleSearch,
		handleOnExport,
		handleDisplayMore,
		setOpenFilterForm,
	} = useTribeMembers(loaderData)

	return (
		<MainContent headerChildren={<Header title="Tribu"></Header>}>
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
					<MemberTable
						currentMonth={currentMounth}
						data={data.members as unknown as MemberMonthlyAttendances[]}
					/>
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							disabled={data.members.length === data.total}
							className="bg-neutral-200 rounded-full"
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
		</MainContent>
	)
}
