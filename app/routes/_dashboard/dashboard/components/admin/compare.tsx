import { useState, useEffect } from 'react'
import { DatePicker } from '~/components/form/date-picker'
import { ViewTabs, type ViewOption } from '~/components/toolbar'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	PieStatistics,
	type StatisticItem,
} from '~/components/stats/statistics'
import { useMediaQuery } from 'usehooks-ts'
import { MOBILE_WIDTH } from '~/shared/constants'

import starEyesAnimation from './animations/star-eyes.json'
import angelAnimation from './animations/angel.json'
import smileAnimation from './animations/smile.json'
import cryingAnimation from './animations/crying.json'
import { compareViews } from '../../constants'

interface Props {
	onClose: () => void
	leftDateData?: AttendanceData
	rightDateData?: AttendanceData
	onExport?: () => void
}

export interface AttendanceItem {
	type: string
	percentage: string
	color: string
	lottieData: any
}

export interface AttendanceData {
	date: string
	attendance: AttendanceItem[]
	stats: StatisticItem[]
}

const defaultLeftData: AttendanceData = {
	date: 'Janvier 2024',
	attendance: [
		{
			type: 'Très régulier',
			percentage: '89%',
			color: 'bg-[#3BC9BF]',
			lottieData: starEyesAnimation,
		},
		{
			type: 'Régulier',
			percentage: '9%',
			color: 'bg-[#E9C724]',
			lottieData: angelAnimation,
		},
		{
			type: 'Peu régulier',
			percentage: '1%',
			color: 'bg-[#F68D2B]',
			lottieData: smileAnimation,
		},
		{
			type: 'Absent',
			percentage: '1%',
			color: 'bg-[#EA503D]',
			lottieData: cryingAnimation,
		},
	],
	stats: [
		{ name: 'Nouveaux', value: 200, color: '#3BC9BF' },
		{ name: 'Anciens', value: 320, color: '#F68D2B' },
	],
}

const defaultRightData: AttendanceData = {
	date: 'Février 2024',
	attendance: [
		{
			type: 'Très régulier',
			percentage: '89%',
			color: 'bg-[#3BC9BF]',
			lottieData: starEyesAnimation,
		},
		{
			type: 'Régulier',
			percentage: '9%',
			color: 'bg-[#E9C724]',
			lottieData: angelAnimation,
		},
		{
			type: 'Peu régulier',
			percentage: '1%',
			color: 'bg-[#F68D2B]',
			lottieData: smileAnimation,
		},
		{
			type: 'Absent',
			percentage: '1%',
			color: 'bg-[#EA503D]',
			lottieData: cryingAnimation,
		},
	],
	stats: [
		{ name: 'Nouveaux', value: 200, color: '#3BC9BF' },
		{ name: 'Anciens', value: 320, color: '#F68D2B' },
	],
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

const LottieIcon = ({ animation, isMobile = false }: LottieIconProps) => {
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

export function CompareComponent({
	onClose,
	onExport,
	leftDateData = defaultLeftData,
	rightDateData = defaultRightData,
}: Readonly<Props>) {
	const [view, setView] = useState<ViewOption>('CULTE')
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	const mobileData = {
		left: {
			...leftDateData,
			attendance: leftDateData.attendance.map(item => ({
				...item,
				percentage: item.percentage.padStart(2, '0'),
			})),
		},
		right: {
			...rightDateData,
			attendance: rightDateData.attendance.map(item => ({
				...item,
				percentage: item.percentage.padStart(2, '0'),
			})),
		},
	}

	return (
		<Dialog open>
			<DialogContent
				onOpenAutoFocus={e => e.preventDefault()}
				onPointerDownOutside={e => e.preventDefault()}
				showCloseButton={false}
				className={
					isDesktop
						? 'lg:max-w-[80rem] lg:min-h-fit px-6'
						: 'max-w-full p-0 overflow-y-auto max-h-full'
				}
			>
				{isDesktop ? (
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
									<DatePicker
										selectedDate={new Date()}
										onSelectDate={() => {}}
									/>
								</div>

								<div className="mb-8">
									<h3 className="text-md font-bold mb-4">
										Présence aux cultes
									</h3>
									<div className="flex gap-2 justify-between">
										{leftDateData.attendance.map((item, i) => (
											<div key={i} className="flex flex-col items-center">
												<LottieIcon animation={item.lottieData} />
												<div
													className={`${item.color} text-white text-md px-3 py-1 rounded-full whitespace-nowrap`}
												>
													{item.type}{' '}
													<span className="font-bold">{item.percentage}</span>
												</div>
											</div>
										))}
									</div>
								</div>
								<div className="flex flex-col items-start">
									<span className="text-md font-bold">
										Intégration de fidèles
									</span>
									<PieStatistics statistics={leftDateData.stats} total={520} />
								</div>
							</div>

							<div className="flex-1 pl-4 space-y-10">
								<div className="mb-2 flex items-center">
									<DatePicker
										selectedDate={new Date()}
										onSelectDate={() => {}}
									/>
								</div>

								<div className="mb-8">
									<h3 className="text-md font-bold mb-4">
										Présence aux cultes
									</h3>
									<div className="flex gap-2 justify-between">
										{rightDateData.attendance.map((item, i) => (
											<div key={i} className="flex flex-col items-center">
												<LottieIcon animation={item.lottieData} />
												<div
													className={`${item.color} text-white text-md px-3 py-1 rounded-full whitespace-nowrap`}
												>
													{item.type}{' '}
													<span className="font-bold">{item.percentage}</span>
												</div>
											</div>
										))}
									</div>
								</div>
								<div className="flex flex-col items-start">
									<span className="text-md font-bold">
										Intégration de fidèles
									</span>
									<PieStatistics statistics={rightDateData.stats} total={520} />
								</div>
							</div>
						</div>
					</>
				) : (
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
									<DatePicker
										selectedDate={new Date()}
										onSelectDate={() => {}}
									/>
								</div>

								<div className="grid grid-cols-4 gap-2 mt-6">
									{mobileData.left.attendance.map((item, i) => (
										<div key={i} className="flex flex-col items-center">
											<LottieIcon animation={item.lottieData} isMobile={true} />
											<div className="text-center flex flex-col items-center">
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
											</div>
										</div>
									))}
								</div>

								<div className="mt-6 flex gap-2">
									{mobileData.left.stats.map((item, index) => (
										<div key={index} className="flex items-center mr-2">
											<div
												className="px-4 py-1 rounded-md text-white mr-2"
												style={{ backgroundColor: item.color }}
											>
												<span className="font-semibold">{item.value}</span>
											</div>
											<span className="text-sm">{item.name}</span>
										</div>
									))}
								</div>
							</div>

							<div className="border-t mt-2 border-gray-300"></div>

							<div className="py-4 space-y-10 mt-4">
								<div className="mb-2 flex items-center justify-between">
									<DatePicker
										selectedDate={new Date()}
										onSelectDate={() => {}}
									/>
								</div>

								<div className="grid grid-cols-4 gap-2 mt-6">
									{mobileData.right.attendance.map((item, i) => (
										<div key={i} className="flex flex-col items-center">
											<LottieIcon animation={item.lottieData} isMobile={true} />
											<div className="text-center flex flex-col items-center">
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
											</div>
										</div>
									))}
								</div>

								<div className="mt-6 flex gap-2">
									{mobileData.right.stats.map((item, index) => (
										<div key={index} className="flex items-center mr-2">
											<div
												className="px-4 py-1 rounded-md text-white mr-2"
												style={{ backgroundColor: item.color }}
											>
												<span className="font-semibold">{item.value}</span>
											</div>
											<span className="text-sm">{item.name}</span>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="p-4 flex gap-2 justify-end">
							<Button
								variant="outline"
								onClick={onClose}
								className="px-3 py-2 text-sm"
							>
								Quitter
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}

export default CompareComponent
