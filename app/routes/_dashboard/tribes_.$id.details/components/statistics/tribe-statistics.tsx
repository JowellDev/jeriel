import type React from 'react'
import { Separator } from '~/components/ui/separator'
import { useMediaQuery } from 'usehooks-ts'
import { cn } from '~/utils/ui'
import { MOBILE_WIDTH } from '~/shared/constants'

interface StatCardProps {
	percentage: string
	count: string
	label: string
	className?: string
}

interface DoubleStatCardProps {
	percentage1: string
	percentage2: string
	count: string
	label1: string
	label2: string
}

export function TribeStatistics(): JSX.Element {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	return (
		<div
			className={cn(
				'flex flex-col bg-white rounded-sm',
				isDesktop && 'flex-row items-center',
			)}
		>
			<div className={cn('w-full p-4', isDesktop && 'basis-3/4 p-8')}>
				<div
					className={cn(
						'flex flex-col items-center space-y-4',
						isDesktop && 'flex-row space-y-0 space-x-28 items-center',
					)}
				>
					<StatCard
						percentage="90%"
						count="709"
						label="Présents aux cultes"
						className={cn('w-fit', isDesktop && 'w-auto')}
					/>

					<div
						className={cn(
							'flex flex-col space-x-28',
							isDesktop && 'flex-row space-y-0 space-x-32',
						)}
					>
						<div className={cn('space-y-6 w-fit', isDesktop && 'w-auto')}>
							<StatCard percentage="20%" count="709" label="Nouveaux" />
							<StatCard percentage="80%" count="709" label="Anciens" />
						</div>

						<div className="space-y-6 w-fit">
							<DoubleStatCard
								percentage1="11%"
								percentage2="89%"
								count="709"
								label1="Absents aux services"
								label2="Présents aux services"
							/>
							<DoubleStatCard
								percentage1="11%"
								percentage2="89%"
								count="709"
								label1="Absents aux services"
								label2="Présents aux services"
							/>
						</div>
					</div>
				</div>
			</div>

			<Separator
				className={cn(
					'bg-gray-200',
					isDesktop ? 'h-[330px]' : 'h-[2px] w-full',
				)}
				orientation={isDesktop ? 'vertical' : 'horizontal'}
			/>

			<div className={cn('w-full p-4', isDesktop && 'basis-1/4 p-16')}>
				<StatCard
					percentage="10%"
					count="709"
					label="Absents au culte"
					className="w-fit"
				/>
			</div>
		</div>
	)
}

const StatCard: React.FC<StatCardProps> = ({
	percentage,
	count,
	label,
	className,
}) => {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	return (
		<div
			className={cn(
				'bg-white p-4 rounded-lg border border-gray-200',
				className,
			)}
		>
			<div className="flex space-x-2">
				<h2
					className={cn(
						'font-bold text-gray-900',
						isDesktop ? 'text-4xl' : 'text-2xl',
					)}
				>
					{percentage}
				</h2>
				<div
					className={cn(
						'mt-auto bg-gray-200 rounded-full',
						isDesktop ? 'text-sm' : 'text-xs',
					)}
				>
					{count} Fidèles
				</div>
			</div>
			<p
				className={cn(
					'text-gray-600 mt-2 font-semibold',
					isDesktop ? 'text-[14px]' : 'text-xs',
				)}
			>
				{label}
			</p>
		</div>
	)
}

const DoubleStatCard: React.FC<DoubleStatCardProps> = ({
	percentage1,
	percentage2,
	count,
	label1,
	label2,
}) => {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	return (
		<div
			className={cn(
				'bg-white p-4 rounded-lg border border-gray-200',
				isDesktop && 'flex justify-between space-x-8',
			)}
		>
			<div className={cn('mb-4', isDesktop && 'mb-0')}>
				<div className="flex space-x-2">
					<h2
						className={cn(
							'font-bold text-gray-900',
							isDesktop ? 'text-4xl' : 'text-2xl',
						)}
					>
						{percentage1}
					</h2>
					<div
						className={cn(
							'mt-auto bg-gray-200 rounded-full',
							isDesktop ? 'text-sm' : 'text-xs',
						)}
					>
						{count} Fidèles
					</div>
				</div>
				<p
					className={cn(
						'text-gray-600 mt-2 font-semibold',
						isDesktop ? 'text-[14px]' : 'text-xs',
					)}
				>
					{label1}
				</p>
			</div>
			<div>
				<div className="flex space-x-2">
					<h2
						className={cn(
							'font-bold text-gray-900',
							isDesktop ? 'text-4xl' : 'text-2xl',
						)}
					>
						{percentage2}
					</h2>
					<div
						className={cn(
							'mt-auto bg-gray-200 rounded-full',
							isDesktop ? 'text-sm' : 'text-xs',
						)}
					>
						{count} Fidèles
					</div>
				</div>
				<p
					className={cn(
						'text-gray-600 mt-2 font-semibold',
						isDesktop ? 'text-[14px]' : 'text-xs',
					)}
				>
					{label2}
				</p>
			</div>
		</div>
	)
}
