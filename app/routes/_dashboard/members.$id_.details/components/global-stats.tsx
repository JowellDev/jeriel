import { AttendanceChartCard } from './stats-card'
import {
	RiTeamLine,
	RiHeartsLine,
	RiBuildingLine,
	RiBuilding2Line,
} from '@remixicon/react'
import { chartConfig } from './chart-config'
import { type MemberWithRelations } from '~/models/member.model'

const chartData = [
	{ month: 'January', desktop: 1, mobile: 1 },
	{ month: 'February', desktop: 2, mobile: 1 },
	{ month: 'March', desktop: 3, mobile: 3 },
	{ month: 'April', desktop: 4, mobile: 4 },
	{ month: 'May', desktop: 5, mobile: 2 },
	{ month: 'June', desktop: 4, mobile: 3 },
	{ month: 'July', desktop: 5, mobile: 5 },
	{ month: 'August', desktop: 5, mobile: 1 },
	{ month: 'September', desktop: 4, mobile: 2 },
	{ month: 'October', desktop: 1, mobile: 1 },
	{ month: 'November', desktop: 5, mobile: 4 },
	{ month: 'December', desktop: 2, mobile: 2 },
]

interface GlobalStatsProps {
	member: MemberWithRelations
}

export default function GlobalStats({ member }: Readonly<GlobalStatsProps>) {
	return (
		<div className="grid sm:grid-cols-2 gap-4">
			<AttendanceChartCard
				Icon={RiBuildingLine}
				title="Présence aux cultes"
				subTitle="Date d'intégration: 23 Mai 2023"
				chartData={chartData}
				config={chartConfig}
				displayComparaisonChart={false}
			/>

			{member.department && (
				<AttendanceChartCard
					Icon={RiBuilding2Line}
					title={`Département | ${member.department.name}`}
					subTitle={`Date d'intégration: 23 Mai 2023`}
					chartData={chartData}
					config={chartConfig}
				/>
			)}
			{member.honorFamily && (
				<AttendanceChartCard
					Icon={RiHeartsLine}
					title={`Famille d’honneur | ${member.honorFamily.name}`}
					subTitle={`Date d'intégration: 23 Mai 2023`}
					chartData={chartData}
					config={chartConfig}
				/>
			)}
			{member.tribe && (
				<AttendanceChartCard
					Icon={RiTeamLine}
					title={`Tribu | ${member.tribe.name}`}
					subTitle={`Date d'intégration: 23 Mai 2023`}
					chartData={chartData}
					config={chartConfig}
				/>
			)}
		</div>
	)
}
