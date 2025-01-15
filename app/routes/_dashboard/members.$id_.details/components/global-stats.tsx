import { AttendanceChartCard, type AttendanceChartDataType } from './stats-card'
import {
	RiTeamLine,
	RiHeartsLine,
	RiBuildingLine,
	RiBuilding2Line,
} from '@remixicon/react'
import {
	sundayChartConfig,
	serviceChartConfig,
	honoryFamilyChartConfig,
} from './chart-config'
import { type MemberWithRelations } from '~/models/member.model'
import { formatIntegrationDate } from '~/utils/date'

const chartData: AttendanceChartDataType[] = [
	{ month: 'Janvier', sunday: 1, service: 1 },
	{ month: 'Février', sunday: 2, service: 1 },
	{ month: 'Mars', sunday: 3, service: 3 },
	{ month: 'Avril', sunday: 4, service: 4 },
	{ month: 'Mai', sunday: 5, service: 2 },
	{ month: 'Juin', sunday: 4, service: 3 },
	{ month: 'Juillet', sunday: 5, service: 5 },
	{ month: 'Août', sunday: 5, service: 1 },
	{ month: 'Septembre', sunday: 4, service: 2 },
	{ month: 'Octobre', sunday: 1, service: 1 },
	{ month: 'Novembre', sunday: 5, service: 4 },
	{ month: 'Décembre', sunday: 2, service: 2 },
]

interface GlobalStatsProps {
	member: MemberWithRelations
}

export default function GlobalStats({ member }: Readonly<GlobalStatsProps>) {
	const integrationDate = member.createdAt
	return (
		<div className="grid sm:grid-cols-2 gap-4">
			<AttendanceChartCard
				Icon={RiBuildingLine}
				title="Présence aux cultes"
				subTitle={`Date d'intégration: ${formatIntegrationDate(integrationDate)}`}
				chartData={chartData}
				config={sundayChartConfig}
				displayComparaisonChart={false}
			/>

			{member.department && (
				<AttendanceChartCard
					Icon={RiBuilding2Line}
					title={`Département | ${member.department.name}`}
					subTitle={`Date d'intégration: 23 Mai 2023`}
					chartData={chartData}
					config={serviceChartConfig}
				/>
			)}
			{member.honorFamily && (
				<AttendanceChartCard
					Icon={RiHeartsLine}
					title={`Famille d’honneur | ${member.honorFamily.name}`}
					subTitle={`Date d'intégration: 23 Mai 2023`}
					chartData={chartData}
					config={honoryFamilyChartConfig}
				/>
			)}
			{member.tribe && (
				<AttendanceChartCard
					Icon={RiTeamLine}
					title={`Tribu | ${member.tribe.name}`}
					subTitle={`Date d'intégration: ${formatIntegrationDate(member.integrationDate?.tribeDate ?? integrationDate)}`}
					chartData={chartData}
					config={serviceChartConfig}
				/>
			)}
		</div>
	)
}
