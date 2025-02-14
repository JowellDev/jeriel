import type { EntityStats, AttendanceStats } from '../types'

export function generatePieChartData(stats: EntityStats) {
	const { newMembers, oldMembers } = stats

	return {
		data: [
			{ member: 'nouveaux', members: newMembers, fill: '#3BC9BF' },
			{ member: 'anciens', members: oldMembers, fill: '#F68D2B' },
		],
		config: {
			nouveaux: {
				label: 'Nouveaux',
				color: '#3BC9BF',
				value: Math.round((newMembers / (newMembers + oldMembers)) * 100),
			},
			anciens: {
				label: 'Anciens',
				color: '#F68D2B',
				value: Math.round((oldMembers / (newMembers + oldMembers)) * 100),
			},
		},
	}
}

export function generateLineChartData(stats: AttendanceStats[]) {
	return {
		data: stats,
		config: {
			présence: {
				label: 'Présence',
				color: '#B5EAE7',
			},
			absence: {
				label: 'Absence',
				color: '#FF5742',
			},
		},
	}
}
