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
import { type MemberWithAttendances } from '~/models/member.model'
import { formatIntegrationDate } from '~/utils/date'

interface GlobalStatsProps {
	member: MemberWithAttendances
	attendanceData: {
		globalAttendance: AttendanceChartDataType[]
		tribeAttendance: AttendanceChartDataType[] | null
		departmentAttendance: AttendanceChartDataType[] | null
		honorFamilyAttendance: AttendanceChartDataType[] | null
	} | null
}

export default function GlobalStats({
	member,
	attendanceData,
}: Readonly<GlobalStatsProps>) {
	const integrationDate = member.createdAt
	return (
		<div className="grid sm:grid-cols-2 gap-4">
			<AttendanceChartCard
				Icon={RiBuildingLine}
				title="Présence aux cultes"
				subTitle={`Date d'intégration: ${formatIntegrationDate(integrationDate)}`}
				chartData={attendanceData?.globalAttendance ?? []}
				config={sundayChartConfig}
				displayComparaisonChart={false}
			/>

			{member.department && (
				<AttendanceChartCard
					Icon={RiBuilding2Line}
					title={`Département | ${member.department.name}`}
					subTitle={`Date d'intégration: ${formatIntegrationDate(member.integrationDate?.departementDate)}`}
					chartData={attendanceData?.departmentAttendance ?? []}
					config={serviceChartConfig}
				/>
			)}
			{member.honorFamily && (
				<AttendanceChartCard
					Icon={RiHeartsLine}
					title={`Famille d'honneur | ${member.honorFamily.name}`}
					subTitle={`Date d'intégration: ${formatIntegrationDate(member.integrationDate?.familyDate)}`}
					chartData={attendanceData?.honorFamilyAttendance ?? []}
					config={honoryFamilyChartConfig}
				/>
			)}
			{member.tribe && (
				<AttendanceChartCard
					Icon={RiTeamLine}
					title={`Tribu | ${member.tribe.name}`}
					subTitle={`Date d'intégration: ${formatIntegrationDate(member.integrationDate?.tribeDate)}`}
					chartData={attendanceData?.tribeAttendance ?? []}
					config={serviceChartConfig}
				/>
			)}
		</div>
	)
}
