import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ManagerHeader } from './manager-header'
import { Statistics } from '~/components/stats/statistics'
import { StatsToolbar } from '~/components/toolbar'
import { type ViewOption } from '~/components/toolbar'
import { useEffect, useState } from 'react'
import { renderTable } from './table/render-table.utils'
import DateSelector from '~/components/form/date-selector'
import { Card } from '~/components/ui/card'
import { type MemberMonthlyAttendances } from '~/models/member.model'
import type { User } from '../../types'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import type { LoaderType } from '../../loader.server'

interface ManagerDashboardProps {
	data: {
		user: User
		members: MemberMonthlyAttendances[]
	}
}

function ManagerDashboard({ data }: Readonly<ManagerDashboardProps>) {
	const [view, setView] = useState<ViewOption>('CULTE')
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)
	const { load } = useFetcher<LoaderType>()

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			// ...data.filterData,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	return (
		<MainContent
			headerChildren={
				<ManagerHeader title="Bon retour !" userName={data.user.name}>
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						<DateSelector onChange={() => {}} />

						<Button className="hidden sm:block" variant={'primary'}>
							Marquer la présence
						</Button>
					</div>
				</ManagerHeader>
			}
		>
			<div className="space-y-4">
				<Statistics />
				<StatsToolbar
					title="Suivi des nouveaux fidèles"
					view={view}
					setView={setView}
					onSearch={handleSearch}
				/>

				<Card>
					{renderTable({
						view,
						data: data.members,
					})}
					<div className="mt-2 mb-2 flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							disabled={true}
							onClick={() => {}}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
		</MainContent>
	)
}

export default ManagerDashboard
