export function TribeStatistics() {
	return (
		<div className="flex items-center justify-between min-h-[20rem] bg-[#FFFFFF]">
			<div className="flex">
				<StatItem
					percentageValue="90%"
					subValue="709 Fidèles"
					label="Présents aux cultes"
				/>
			</div>
			<div className="flex flex-col justify-between items-center">
				<StatItem
					percentageValue="20%"
					subValue="709 Fidèles"
					label="Nouveaux"
				/>
				<StatItem
					percentageValue="80%"
					subValue="709 Fidèles"
					label="Anciens"
				/>
			</div>
		</div>
	)
}

interface StatItemProps {
	percentageValue: string
	subValue: string
	label: string
}

const StatItem = ({
	percentageValue,
	label,
	subValue,
}: Readonly<StatItemProps>) => (
	<div className="flex items-center border border-gray-200 min-w-[15rem] rounded-lg p-4 shadow-sm">
		<div>
			<div className="text-4xl font-bold">{percentageValue}</div>
			<div className="text-xs text-gray-500 mt-1">{label}</div>
		</div>
		<div>
			<div className="text-[12px] text-gray-600 px-1 rounded-full bg-gray-200">
				{subValue}
			</div>
		</div>
	</div>
)
