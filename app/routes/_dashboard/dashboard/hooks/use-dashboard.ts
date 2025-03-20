import { useCallback, useEffect, useState } from 'react'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import type { LoaderType } from '../loader.server'
import type { ViewOption } from '~/components/toolbar'
import type { SerializeFrom } from '@remix-run/node'
import type { DateRange } from 'react-day-picker'
import { endOfMonth, startOfMonth } from 'date-fns'
import type { MemberFilterOptions } from '~/shared/types'
import type { AttendanceStats, EntityType } from '../types'
import { useApiData } from '~/hooks/api-data.hook'

type LoaderReturnData = SerializeFrom<LoaderType>

export function useDashboard(loaderData: LoaderReturnData) {
	const [data, setData] = useState(loaderData)
	const [view, setView] = useState<ViewOption>('STAT')
	const [statView, setStatView] = useState<ViewOption>('CULTE')
	const [newView, setNewView] = useState<ViewOption>('STAT')
	const [searchParams, setSearchParams] = useSearchParams()
	const { load, ...fetcher } = useFetcher<LoaderType>()

	const statsApiData = useApiData<{
		stats: AttendanceStats
	}>(`/api/manager-stats`)
	const [statsData, setStatsData] = useState<AttendanceStats>()
	const debounced = useDebounceCallback(setSearchParams, 500)
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [selectedEntity, setSelectedEntity] = useState<EntityType>()

	const entityOptions =
		data?.entityStats.map(entity => ({
			value: entity?.id,
			label: `${
				entity?.type === 'tribe'
					? 'Tribu'
					: entity?.type === 'department'
						? 'Département'
						: "Famille d'honneur"
			} - ${entity?.entityName}`,
		})) || []

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams(data)
			load(`${location.pathname}?${params}`)
		},
		[load],
	)

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterData,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	function handleOnPeriodChange(range: DateRange) {
		if (!(range.from && range.to)) return

		if (view === 'STAT') {
			const currentParams = {
				from: startOfMonth(range.from).toISOString(),
				to: endOfMonth(range.to).toISOString(),
			}

			if (data.filterData?.entityType && data.filterData?.entityId) {
				Object.assign(currentParams, {
					entityType: data.filterData.entityType,
					entityId: data.filterData.entityId,
				})
			}
			const queryString = new URLSearchParams(currentParams)
			statsApiData.refresh(queryString)
		}

		const filterData = {
			...data?.filterData,
			from: range?.from?.toISOString(),
			to: range?.to?.toISOString(),
			page: 1,
		}

		setCurrentMonth(startOfMonth(range.to))
		reloadData(filterData)
	}

	const handleEntitySelection = (entityId: string) => {
		const selectedEntity = data.entityStats.find(
			entity => entity?.id === entityId,
		)

		if (!selectedEntity) return

		setSelectedEntity(selectedEntity.type)

		if (view === 'STAT') {
			const currentParams = {
				from: startOfMonth(currentMonth).toISOString(),
				to: endOfMonth(currentMonth).toISOString(),
				entityType: selectedEntity.type,
				entityId: entityId,
			}

			const queryString = new URLSearchParams(currentParams)
			statsApiData.refresh(queryString)
		}

		const filterData = {
			...data.filterData,
			entityType: selectedEntity.type,
			entityId: selectedEntity.id,
		}

		reloadData(filterData)
	}

	function handleDisplayMore() {
		const option = data.filterData
		reloadData({ ...option, page: option.page + 1 })
	}

	const handleSpeedDialItemClick = (action: string) => {
		return true
	}

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	function handleOnExport() {
		//
	}

	useEffect(() => {
		if (!statsApiData.isLoading && statsApiData.data) {
			setStatsData(statsApiData.data.stats)
		}
	}, [statsApiData.data, statsApiData.isLoading])

	return {
		data,
		view,
		setView,
		statView,
		newView,
		setNewView,
		setStatView,
		handleSearch,
		handleOnExport,
		handleOnPeriodChange,
		handleEntitySelection,
		handleDisplayMore,
		handleSpeedDialItemClick,
		entityOptions,
		selectedEntity,
		currentMonth,
		fetcher,
		statsData,
		isFecthing: statsApiData.isLoading,
	}
}
