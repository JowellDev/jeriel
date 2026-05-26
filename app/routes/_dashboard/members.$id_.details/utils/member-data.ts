import type { MemberWithAttendances, AttendanceChartDataType } from '~/models/member.model'

const ALL_MONTHS = [
	'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
	'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

function initMonthEntry(month: string) {
	return { month, sunday: 0, service: 0 }
}

function incrementHonorFamilyAttendance(
	acc: Record<string, AttendanceChartDataType>,
	attendance: any,
	month: string,
) {
	if (attendance.report.entity === 'HONOR_FAMILY' && (attendance.inService || attendance.inMeeting)) {
		acc[month].service += 1
	}
	if ((attendance.report.entity === 'TRIBE' || attendance.report.entity === 'DEPARTMENT') && attendance.inChurch) {
		acc[month].sunday += 1
	}
}

function incrementEntityAttendance(
	acc: Record<string, AttendanceChartDataType>,
	attendance: any,
	month: string,
	entity?: string,
) {
	if (!entity || attendance.report.entity === entity) {
		if (attendance.inChurch) acc[month].sunday += 1
		if (attendance.inService || attendance.inMeeting) acc[month].service += 1
	}
}

function buildMonthlyAttendanceMap(
	member: MemberWithAttendances,
	entity?: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY',
): Record<string, AttendanceChartDataType> {
	return member.attendances.reduce(
		(acc, attendance) => {
			const month = new Date(attendance.date).toLocaleString('fr-FR', { month: 'long' })
			if (!acc[month]) acc[month] = initMonthEntry(month)
			if (entity === 'HONOR_FAMILY') {
				incrementHonorFamilyAttendance(acc, attendance, month)
			} else {
				incrementEntityAttendance(acc, attendance, month, entity)
			}
			return acc
		},
		{} as Record<string, AttendanceChartDataType>,
	)
}

function buildCompleteChartData(monthlyAttendance: Record<string, AttendanceChartDataType>): AttendanceChartDataType[] {
	return ALL_MONTHS.map(month => ({
		month: month.charAt(0).toUpperCase() + month.slice(1),
		sunday: monthlyAttendance[month]?.sunday ?? 0,
		service: monthlyAttendance[month]?.service ?? 0,
	}))
}

export function buildAttendanceChartData(
	member: MemberWithAttendances,
	entity?: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY',
): AttendanceChartDataType[] {
	return buildCompleteChartData(buildMonthlyAttendanceMap(member, entity))
}

export function getMemberAttendanceData(member: MemberWithAttendances) {
	const hasSundayAttendanceSource = member.tribe || member.department

	return {
		globalAttendance: buildAttendanceChartData(member),
		tribeAttendance: member.tribe ? buildAttendanceChartData(member, 'TRIBE') : null,
		departmentAttendance: member.department ? buildAttendanceChartData(member, 'DEPARTMENT') : null,
		honorFamilyAttendance: member.honorFamily && hasSundayAttendanceSource
			? buildAttendanceChartData(member, 'HONOR_FAMILY')
			: null,
	}
}
