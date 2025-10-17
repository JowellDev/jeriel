import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { AttendanceData } from '~/shared/types'

interface AttendanceStats {
	veryRegular: number
	regular: number
	littleRegular: number
	absent: number
}

export function formatAttendanceData(
	data: {
		totalMembers: number
		stats: AttendanceStats
		memberStats: {
			newMembers: number
			oldMembers: number
		}
	},
	date: Date,
): AttendanceData {
	const total = data.totalMembers

	const veryRegularPercentage =
		total > 0 ? Math.round((data.stats.veryRegular / total) * 100) : 0
	const regularPercentage =
		total > 0 ? Math.round((data.stats.regular / total) * 100) : 0
	const littleRegularPercentage =
		total > 0 ? Math.round((data.stats.littleRegular / total) * 100) : 0
	const absentPercentage =
		total > 0 ? Math.round((data.stats.absent / total) * 100) : 0

	const dateLabel = `${format(date, 'MMMM yyyy', { locale: fr })}`

	return {
		total,
		date: dateLabel,
		stats: [
			{
				type: 'Très régulier',
				percentage: `${veryRegularPercentage}%`,
				color: 'bg-[#3BC9BF]',
				lottieData: null,
			},
			{
				type: 'Régulier',
				percentage: `${regularPercentage}%`,
				color: 'bg-[#E9C724]',
				lottieData: null,
			},
			{
				type: 'Peu régulier',
				percentage: `${littleRegularPercentage}%`,
				color: 'bg-[#F68D2B]',
				lottieData: null,
			},
			{
				type: 'Absent',
				percentage: `${absentPercentage}%`,
				color: 'bg-[#EA503D]',
				lottieData: null,
			},
		],
		memberStats: [
			{
				name: 'Nouveaux',
				value: data.memberStats.newMembers,
				color: '#3BC9BF',
			},
			{ name: 'Anciens', value: data.memberStats.oldMembers, color: '#F68D2B' },
		],
	}
}
