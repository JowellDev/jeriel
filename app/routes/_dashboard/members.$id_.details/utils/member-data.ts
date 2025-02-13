import type {
	MemberWithAttendances,
	AttendanceChartDataType,
} from '~/models/member.model'

export function buildAttendanceChartData(
	member: MemberWithAttendances,
	entity?: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY',
): AttendanceChartDataType[] {
	const monthlyAttendance = member.attendances.reduce(
		(acc, attendance) => {
			const date = new Date(attendance.date)
			const month = date.toLocaleString('fr-FR', { month: 'long' })

			if (!acc[month]) {
				acc[month] = {
					month,
					sunday: 0,
					service: 0,
				}
			}

			if (entity === 'HONOR_FAMILY') {
				if (
					attendance.report.entity === 'HONOR_FAMILY' &&
					(attendance.inService || attendance.inMeeting)
				) {
					acc[month].service += 1
				}
				if (
					(attendance.report.entity === 'TRIBE' ||
						attendance.report.entity === 'DEPARTMENT') &&
					attendance.inChurch
				) {
					acc[month].sunday += 1
				}
			} else if (!entity || attendance.report.entity === entity) {
				if (attendance.inChurch) {
					acc[month].sunday += 1
				}
				if (attendance.inService || attendance.inMeeting) {
					acc[month].service += 1
				}
			}

			return acc
		},
		{} as Record<string, AttendanceChartDataType>,
	)

	const allMonths = [
		'janvier',
		'février',
		'mars',
		'avril',
		'mai',
		'juin',
		'juillet',
		'août',
		'septembre',
		'octobre',
		'novembre',
		'décembre',
	]

	const completeChartData = allMonths.map(month => ({
		month: month.charAt(0).toUpperCase() + month.slice(1),
		sunday: monthlyAttendance[month]?.sunday ?? 0,
		service: monthlyAttendance[month]?.service ?? 0,
	}))

	return completeChartData
}

export function getMemberAttendanceData(member: MemberWithAttendances) {
	const hasSundayAttendanceSource = member.tribe || member.department

	return {
		globalAttendance: buildAttendanceChartData(member),
		tribeAttendance: member.tribe
			? buildAttendanceChartData(member, 'TRIBE')
			: null,
		departmentAttendance: member.department
			? buildAttendanceChartData(member, 'DEPARTMENT')
			: null,
		honorFamilyAttendance:
			member.honorFamily && hasSundayAttendanceSource
				? buildAttendanceChartData(member, 'HONOR_FAMILY')
				: null,
	}
}
