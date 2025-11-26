import { useState, useEffect, useCallback } from 'react'
import { useFetcher } from '@remix-run/react'
import { type DateRange } from 'react-day-picker'
import { startOfMonth } from 'date-fns'
import { useMediaQuery } from 'usehooks-ts'

import { buildSearchParams } from '~/utils/url'
import { MOBILE_WIDTH } from '~/shared/constants'
import type { AttendanceData } from '~/shared/types'
import { ViewTabs, type ViewOption } from '~/components/toolbar'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Drawer,
	DrawerContent,
	DrawerFooter,
	DrawerClose,
} from '~/components/ui/drawer'
import { PieStatistics } from '~/components/stats/statistics'
import { Skeleton } from '~/components/ui/skeleton'
import MonthPicker from '~/components/form/month-picker'
import { type AttendanceLoader } from '~/routes/api/compare/_index'

import starEyesAnimation from './animations/star-eyes.json'
import angelAnimation from './animations/angel.json'
import smileAnimation from './animations/smile.json'
import cryingAnimation from './animations/crying.json'
import {
	compareViews,
	defaultLeftData,
	defaultRightData,
} from '../../constants'
import type { FilterData } from '../../types'

interface Props {
	onClose: () => void
	leftDateData?: AttendanceData
	rightDateData?: AttendanceData
	onExport?: () => void
}

function enrichWithAnimations(data: any) {
	if (!data) return data

	const animations: Record<string, any> = {
		'Très régulier': starEyesAnimation,
		Régulier: angelAnimation,
		'Peu régulier': smileAnimation,
		Absent: cryingAnimation,
	}

	return {
		...data,
		stats: data.stats.map((item: any) => ({
			...item,
			lottieData: animations[item.type] || starEyesAnimation,
		})),
	}
}

function useClient() {
	const [isClient, setIsClient] = useState(false)
	useEffect(() => {
		setIsClient(true)
	}, [])
	return isClient
}

interface LottieIconProps {
	animation: any
	isMobile?: boolean
}

const LottieIcon = ({ animation, isMobile = false }: Readonly<LottieIconProps>) => {
	const isClient = useClient()

	if (!isClient) {
		return (
			<div
				className={
					isMobile
						? 'flex items-center justify-center'
						: 'w-20 h-20 flex items-center justify-center mb-2'
				}
			></div>
		)
	}

	const Lottie = require('react-lottie-player').default

	if (isMobile) {
		return (
			<div className="flex items-center justify-center">
				<Lottie
					loop
					animationData={animation}
					play
					style={{ width: 60, height: 60 }}
				/>
			</div>
		)
	}

	return (
		<div className="w-20 h-20 flex items-center justify-center mb-2">
			<Lottie
				loop
				animationData={animation}
				play
				style={{ width: 80, height: 80 }}
			/>
		</div>
	)
}

// Component for desktop and mobile content
const CompareContent = ({
	view,
	setView,
	leftDateData,
	rightDateData,
	onClose,
	onDateChange,
	isMobile = false,
	isLoading = false,
}: Readonly<{
	view: ViewOption
	setView: (view: ViewOption) => void
	leftDateData: AttendanceData
	rightDateData: AttendanceData
	onClose: () => void
	onDateChange: (range: DateRange, isSecondPicker?: boolean) => void
	isLoading?: boolean
	isMobile?: boolean
}>) => {
	const mobileData = isMobile
		? {
				left: {
					...leftDateData,
					stats: leftDateData.stats.map(item => ({
						...item,
						percentage: item.percentage.padStart(2, '0'),
					})),
				},
				right: {
					...rightDateData,
					stats: rightDateData.stats.map(item => ({
						...item,
						percentage: item.percentage.padStart(2, '0'),
					})),
				},
			}
		: { left: leftDateData, right: rightDateData }

	const [currentMonth, setCurrentMonth] = useState(new Date())

	const handleFirstDateChange = ({ from, to }: DateRange) => {
		if (from && to) {
			setCurrentMonth(new Date(startOfMonth(to)))
			onDateChange({ from, to }, false)
		}
	}

	const handleSecondDateChange = ({ from, to }: DateRange) => {
		if (from && to) {
			onDateChange({ from, to }, true)
		}
	}

	if (isMobile) {
		return (
			<div className="w-full py-4 space-y-6">
				<div className="flex flex-col space-y-4">
					<span className="text-xl font-bold ml-3">Comparaison</span>
					<ViewTabs
						options={compareViews}
						activeView={view}
						setView={setView}
					/>
				</div>

				<div className="px-4">
					<div className="py-4 space-y-10">
						<div className="mb-2 flex items-center justify-between">
							<MonthPicker
								defaultMonth={new Date(currentMonth)}
								onChange={handleFirstDateChange}
								className="w-full"
							/>
						</div>

						<div className="grid grid-cols-4 gap-2 mt-6">
							{mobileData.left.stats.map((item, i) => (
								<div key={i} className="flex flex-col items-center">
									{isLoading ? (
										<div>
											<Skeleton className="w-12 h-12 rounded-full p-2" />
										</div>
									) : (
										<LottieIcon animation={item.lottieData} isMobile={true} />
									)}
									<div className="text-center flex flex-col items-center">
										{isLoading ? (
											<div className="h-6 w-8 mt-1">
												<Skeleton className="w-full h-full rounded-sm" />
											</div>
										) : (
											<span
												style={{
													color: item.color
														.replace('bg-[', '')
														.replace(']', ''),
												}}
												className="font-bold"
											>
												{item.percentage}
											</span>
										)}
										{isLoading ? (
											<div className="h-4 w-16 mt-2">
												<Skeleton className="w-full h-full rounded-full" />
											</div>
										) : (
											<span
												style={{
													color: item.color
														.replace('bg-[', '')
														.replace(']', ''),
												}}
												className="text-xs"
											>
												{item.type}
											</span>
										)}
									</div>
								</div>
							))}
						</div>

						<div className="mt-6 flex justify-evenly">
							{mobileData.left.memberStats.map((item, index) => (
								<div key={index} className="flex items-center mr-2">
									{isLoading ? (
										<div className="h-8 w-12 rounded-md mr-2">
											<Skeleton className="w-full h-full rounded-md" />
										</div>
									) : (
										<div
											className="px-4 py-1 rounded-md text-white mr-2"
											style={{ backgroundColor: item.color }}
										>
											<span className="font-semibold">{item.value}</span>
										</div>
									)}
									{isLoading ? (
										<div className="h-4 w-16 rounded-md">
											<Skeleton className="w-full h-full rounded-md" />
										</div>
									) : (
										<span className="text-sm">{item.name}</span>
									)}
								</div>
							))}
						</div>
					</div>

					<div className="border-t mt-2 border-gray-300"></div>

					<div className="py-4 space-y-10 mt-4">
						<div className="mb-2 flex items-center justify-between">
							<MonthPicker
								defaultMonth={new Date(currentMonth)}
								onChange={handleSecondDateChange}
								className="w-full"
							/>
						</div>

						<div className="grid grid-cols-4 gap-2 mt-6">
							{mobileData.right.stats.map((item, i) => (
								<div key={i} className="flex flex-col items-center">
									{isLoading ? (
										<div>
											<Skeleton className="w-12 h-12 rounded-full p-2" />
										</div>
									) : (
										<LottieIcon animation={item.lottieData} isMobile={true} />
									)}
									<div className="text-center flex flex-col items-center">
										{isLoading ? (
											<div className="h-6 w-8 mt-1">
												<Skeleton className="w-full h-full rounded-sm" />
											</div>
										) : (
											<span
												style={{
													color: item.color
														.replace('bg-[', '')
														.replace(']', ''),
												}}
												className="font-bold"
											>
												{item.percentage}
											</span>
										)}
										{isLoading ? (
											<div className="h-4 w-16 mt-2">
												<Skeleton className="w-full h-full rounded-full" />
											</div>
										) : (
											<span
												style={{
													color: item.color
														.replace('bg-[', '')
														.replace(']', ''),
												}}
												className="text-xs"
											>
												{item.type}
											</span>
										)}
									</div>
								</div>
							))}
						</div>

						<div className="mt-6 flex justify-evenly">
							{mobileData.right.memberStats.map((item, index) => (
								<div key={index} className="flex items-center mr-2">
									{isLoading ? (
										<div className="h-8 w-12 rounded-md mr-2">
											<Skeleton className="w-full h-full rounded-md" />
										</div>
									) : (
										<div
											className="px-4 py-1 rounded-md text-white mr-2"
											style={{ backgroundColor: item.color }}
										>
											<span className="font-semibold">{item.value}</span>
										</div>
									)}
									{isLoading ? (
										<div className="h-4 w-16 rounded-md">
											<Skeleton className="w-full h-full rounded-md" />
										</div>
									) : (
										<span className="text-sm">{item.name}</span>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>
					<div className="flex items-center justify-between mb-4 bg-white">
						<div className="flex space-x-5 items-center">
							<span className="text-2xl">Comparaison</span>
							<ViewTabs
								options={compareViews}
								activeView={view}
								setView={setView}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								onClick={onClose}
								className="border border-gray-200 px-3 py-1 text-sm"
							>
								Quitter
							</Button>
						</div>
					</div>
				</DialogTitle>
			</DialogHeader>

			<div className="flex w-full gap-4">
				<div className="flex-1 border-r pr-4 space-y-10">
					<div className="mb-2 flex items-center">
						<MonthPicker
							defaultMonth={new Date(currentMonth)}
							onChange={handleFirstDateChange}
							className="w-full"
						/>
					</div>

					<div className="mb-8">
						<h3 className="text-md font-bold mb-4">Présence aux cultes</h3>

						<div className="flex gap-2 justify-between">
							{leftDateData.stats.map((item, i) => (
								<div key={i} className="flex flex-col items-center">
									{isLoading ? (
										<span className="w-20 h-20">
											<Skeleton className="w-full h-full rounded-full" />
										</span>
									) : (
										<LottieIcon animation={item.lottieData} />
									)}

									{isLoading ? (
										<span className="w-36 h-10 px-3 py-1">
											<Skeleton className="w-full h-full rounded-full" />
										</span>
									) : (
										<div
											className={`${item.color} text-white text-md px-3 py-1 rounded-full whitespace-nowrap`}
										>
											{item.type}
											<span className="font-bold">{item.percentage}</span>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
					<div className="flex flex-col items-start">
						<span className="text-md font-bold">Intégration de fidèles</span>
						<PieStatistics
							statistics={leftDateData.memberStats}
							total={leftDateData.total}
							isFetching={isLoading}
						/>
					</div>
				</div>

				<div className="flex-1 pl-4 space-y-10">
					<div className="mb-2 flex items-center">
						<MonthPicker
							defaultMonth={new Date(currentMonth)}
							onChange={handleSecondDateChange}
							className="w-full"
						/>
					</div>

					<div className="mb-8">
						<h3 className="text-md font-bold mb-4">Présence aux cultes</h3>
						<div className="flex gap-2 justify-between">
							{rightDateData.stats.map((item, i) => (
								<div key={i} className="flex flex-col items-center">
									{isLoading ? (
										<div className="w-20 h-20">
											<Skeleton className="w-full h-full rounded-full" />
										</div>
									) : (
										<LottieIcon animation={item.lottieData} />
									)}

									{isLoading ? (
										<div className="w-36 h-10 px-3 py-1">
											<Skeleton className="w-full h-full rounded-full" />
										</div>
									) : (
										<div
											className={`${item.color} text-white text-md px-3 py-1 rounded-full whitespace-nowrap`}
										>
											{item.type}
											<span className="font-bold">{item.percentage}</span>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
					<div className="flex flex-col items-start">
						<span className="text-md font-bold">Intégration de fidèles</span>
						<PieStatistics
							statistics={rightDateData.memberStats}
							total={rightDateData.total}
							isFetching={isLoading}
						/>
					</div>
				</div>
			</div>
		</>
	)
}

export function CompareComponent({ onClose, onExport }: Readonly<Props>) {
	const [view, setView] = useState<ViewOption>('CULTE')
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<AttendanceLoader>()
	const [isLoading, setIsLoading] = useState(false)
	const [filterData, setFilterData] = useState<FilterData>()

	const [leftDateData, setLeftDateData] =
		useState<AttendanceData>(defaultLeftData)
	const [rightDateData, setRightDateData] =
		useState<AttendanceData>(defaultRightData)

	const handleDateChange = useCallback(
		(range: DateRange, isSecondPicker = false) => {
			if (!range.from || !range.to) return

			setIsLoading(true)

			const now = new Date()
			const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1)
			const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)

			const params = buildSearchParams({
				entity: view,
				firstDateFrom: (isSecondPicker
					? defaultFrom
					: range.from
				).toISOString(),
				firstDateTo: (isSecondPicker ? defaultTo : range.to).toISOString(),
				secondDateFrom: (isSecondPicker
					? range.from
					: defaultFrom
				).toISOString(),
				secondDateTo: (isSecondPicker ? range.to : defaultTo).toISOString(),
			})

			fetcher.load(`/api/compare?${params.toString()}`)
		},
		[view, fetcher],
	)

	const handleViewChange = useCallback(
		(newView: ViewOption) => {
			setView(newView)

			const { entity, ...filter } = filterData as FilterData

			const params = buildSearchParams({
				entity: newView,
				...filter,
			})

			fetcher.load(`/api/compare?${params.toString()}`)
		},
		[filterData, fetcher],
	)

	useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle') {
			setIsLoading(false)

			if (fetcher.data.filterData) {
				setFilterData(fetcher.data.filterData)
			}

			if (fetcher.data.firstPeriodData) {
				setLeftDateData(enrichWithAnimations(fetcher.data.firstPeriodData))
			}

			if (fetcher.data.secondPeriodData) {
				setRightDateData(enrichWithAnimations(fetcher.data.secondPeriodData))
			}
		} else if (fetcher.state === 'loading') {
			setIsLoading(true)
		}
	}, [fetcher.data, fetcher.state])

	useEffect(() => {
		const now = new Date()
		const from = new Date(now.getFullYear(), now.getMonth(), 1)
		const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)

		handleDateChange({ from, to }, false)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (isDesktop) {
		return (
			<Dialog open>
				<DialogContent
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
					showCloseButton={false}
					className="lg:max-w-[80rem] lg:min-h-fit px-6"
				>
					<CompareContent
						view={view}
						setView={handleViewChange}
						leftDateData={leftDateData}
						rightDateData={rightDateData}
						onClose={onClose}
						onDateChange={handleDateChange}
						isLoading={isLoading}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onClose}>
			<DrawerContent>
				<CompareContent
					view={view}
					setView={handleViewChange}
					leftDateData={leftDateData}
					rightDateData={rightDateData}
					onClose={onClose}
					isMobile={true}
					onDateChange={handleDateChange}
					isLoading={isLoading}
				/>

				<DrawerFooter className="pt-2">
					<DrawerClose asChild>
						<Button variant="outline">Fermer</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}

export default CompareComponent
