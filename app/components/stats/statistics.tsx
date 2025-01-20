import React from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { Separator } from '~/components/ui/separator'
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

export function Statistics() {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	return (
		<div className="w-full bg-white rounded-lg">
			{isDesktop ? (
				<div className="flex flex-row items-center justify-center">
					<div className="p-4">
						<StatCard
							percentage="90%"
							count="709"
							label="Présents aux cultes"
						/>
					</div>

					<div className="flex flex-row items-center gap-8 p-4">
						<div className="flex flex-col gap-4">
							<StatCard percentage="20%" count="709" label="Nouveaux" />
							<StatCard percentage="80%" count="709" label="Anciens" />
						</div>

						<div className="flex flex-col gap-4">
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

					<Separator orientation="vertical" className="h-64 mx-4" />

					<div className="p-4">
						<StatCard percentage="10%" count="709" label="Absents au culte" />
					</div>
				</div>
			) : (
				<div className="p-6 flex flex-col items-center">
					<div className="w-[280px] mb-6">
						<StatCard
							percentage="90%"
							count="709"
							label="Présents aux cultes"
						/>
					</div>

					<div className="w-full max-w-[400px] mb-6">
						<div className="flex justify-between mb-6">
							<div className="w-[140px]">
								<StatCard percentage="20%" count="709" label="Nouveaux" />
							</div>
							<div className="w-[140px]">
								<StatCard percentage="80%" count="709" label="Anciens" />
							</div>
						</div>

						<div className="space-y-6">
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

					<Separator className="w-full h-[1px] bg-gray-200 mb-6" />

					<div className="w-[280px]">
						<StatCard percentage="10%" count="709" label="Absents au culte" />
					</div>
				</div>
			)}
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
			className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`}
		>
			<div className="flex items-center gap-2">
				<h2
					className={`font-bold text-gray-900 ${isDesktop ? 'text-4xl' : 'text-2xl'}`}
				>
					{percentage}
				</h2>
				<div
					className={`px-2 py-1 bg-gray-100 rounded-full text-gray-600 ${isDesktop ? 'text-sm' : 'text-xs'}`}
				>
					{count} Fidèles
				</div>
			</div>
			<p
				className={`text-gray-600 mt-2 font-semibold ${isDesktop ? 'text-sm' : 'text-xs'}`}
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
		<div className="bg-white p-4 rounded-lg border border-gray-200">
			<div
				className={`flex ${isDesktop ? 'flex-row justify-between gap-8' : 'flex-row justify-between'}`}
			>
				<div className={isDesktop ? 'w-auto' : 'w-[45%]'}>
					<div className="flex items-center gap-2">
						<h2
							className={`font-bold text-gray-900 ${isDesktop ? 'text-4xl' : 'text-2xl'}`}
						>
							{percentage1}
						</h2>
						<div
							className={`px-2 py-1 bg-gray-100 rounded-full text-gray-600 ${isDesktop ? 'text-sm' : 'text-xs'}`}
						>
							{count} Fidèles
						</div>
					</div>
					<p
						className={`text-gray-600 mt-2 font-semibold ${isDesktop ? 'text-sm' : 'text-xs'}`}
					>
						{label1}
					</p>
				</div>

				<div className={isDesktop ? 'w-auto' : 'w-[45%]'}>
					<div className="flex items-center gap-2">
						<h2
							className={`font-bold text-gray-900 ${isDesktop ? 'text-4xl' : 'text-2xl'}`}
						>
							{percentage2}
						</h2>
						<div
							className={`px-2 py-1 bg-gray-100 rounded-full text-gray-600 ${isDesktop ? 'text-sm' : 'text-xs'}`}
						>
							{count} Fidèles
						</div>
					</div>
					<p
						className={`text-gray-600 mt-2 font-semibold ${isDesktop ? 'text-sm' : 'text-xs'}`}
					>
						{label2}
					</p>
				</div>
			</div>
		</div>
	)
}
