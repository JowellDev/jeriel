import { DateRangePicker } from '~/components/form/date-range-picker'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { BirthdayTable } from './components/birthdays-table'
import { loaderFn, type LoaderType } from './loader.server'
import {
	type MetaFunction,
	useFetcher,
	useLoaderData,
	useLocation,
	useSearchParams,
} from '@remix-run/react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { useCallback, useEffect, useState } from 'react'
import { type DateRange } from 'react-day-picker'
import { parseISO } from 'date-fns'
import { buildSearchParams } from '~/utils/url'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'
import { BirthdayMemberDetails } from './components/member-details'
import type { BirthdayMember } from './types'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export const meta: MetaFunction = () => [
	{ title: 'Jeriel | Gestion des anniversaires' },
]
export const loader = loaderFn

export default function Birthday() {
	const loaderData = useLoaderData<LoaderType>()
	const { load } = useFetcher<LoaderType>()
	const location = useLocation()
	const [searchParams, setSearchParams] = useSearchParams()
	const [data, setData] = useState(loaderData)

	const [from, setFrom] = useState<Date | undefined>(
		parseISO(data.filterData.from),
	)
	const [to, setTo] = useState<Date | undefined>(parseISO(data.filterData.to))
	const [openDetails, setOpenDetails] = useState(false)
	const [selectedMember, setSelectedMember] = useState<
		BirthdayMember | undefined
	>(undefined)

	const reloadData = useCallback(
		(option: { from?: Date; to?: Date }) => {
			const params = buildSearchParams(option)
			setSearchParams(params)
		},
		[setSearchParams],
	)

	const handleOnPeriodChange = useCallback(
		(dateRange: DateRange | undefined) => {
			if (!dateRange) return
			setFrom(dateRange.from)
			setTo(dateRange.to)
		},
		[],
	)

	const handleFilter = useCallback(() => {
		const filter = {
			from: from ? parseISO(from.toISOString()) : undefined,
			to: to ? parseISO(to.toISOString()) : undefined,
		}

		reloadData(filter)
	}, [from, reloadData, to])

	const handleResetDateRange = useCallback(() => {
		handleOnPeriodChange({ from: undefined, to: undefined })
		setFrom(undefined)
		setTo(undefined)
		reloadData({ from: undefined, to: undefined })
	}, [handleOnPeriodChange, reloadData])

	function handleDisplayMore() {
		const params = buildSearchParams({
			...data.filterData,
			take: data.filterData.take + DEFAULT_QUERY_TAKE,
		})
		setSearchParams(params)
	}

	function handleBirthdayDetails(member?: BirthdayMember) {
		if (!member) return
		setSelectedMember(member)
		setOpenDetails(true)
	}

	useEffect(() => {
		setData(loaderData)
	}, [loaderData])

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, location.pathname, searchParams])

	const entityType = data.userPermissions.managedEntities.map(d => d.type)

	return (
		<MainContent
			headerChildren={
				<Header title="Anniversaires">
					<div className="flex space-x-2">
						<div className="hidden sm:block">
							<DateRangePicker
								defaultLabel="Sélectionner une période"
								onResetDate={handleResetDateRange}
								defaultValue={undefined}
								onValueChange={dateRange => handleOnPeriodChange(dateRange)}
							/>
						</div>
						<Button
							className="hidden sm:block"
							variant={'primary'}
							disabled={!(from && to)}
							onClick={handleFilter}
						>
							Filtrer
						</Button>
					</div>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="sm:hidden flex space-x-2">
					<DateRangePicker
						defaultLabel="Sélectionner une période"
						onResetDate={handleResetDateRange}
						defaultValue={undefined}
						onValueChange={dateRange => handleOnPeriodChange(dateRange)}
						className="w-full"
					/>
					<Button variant={'primary'} disabled={!(from && to)}>
						Filtrer
					</Button>
				</div>
				<Card className="space-y-2 pb-4 mb-2">
					<BirthdayTable
						data={data.birthdays}
						entityType={entityType[0]}
						canSeeAll={data.userPermissions.canSeeAll}
						onSeeMember={handleBirthdayDetails}
					/>
					<div className="flex justify-center pb-2">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							disabled={data.filterData.take >= data.totalCount}
							className="bg-neutral-200 rounded-full"
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>

				{openDetails && selectedMember && (
					<BirthdayMemberDetails
						member={selectedMember}
						onClose={() => setOpenDetails(false)}
					/>
				)}
			</div>
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
