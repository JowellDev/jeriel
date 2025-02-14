import type { AttendanceStats, EntityWithStats, PieChartData } from '../types'

export function generatePieChartData(
	newMembers: number,
	oldMembers: number,
): PieChartData {
	const total = newMembers + oldMembers

	return {
		data: [
			{ member: 'nouveaux', members: newMembers, fill: '#3BC9BF' },
			{ member: 'anciens', members: oldMembers, fill: '#F68D2B' },
		],
		config: {
			nouveaux: {
				label: 'Nouveaux',
				color: '#3BC9BF',
				value:
					total === 0
						? 0
						: Math.round((newMembers / (newMembers + oldMembers)) * 100),
			},
			anciens: {
				label: 'Anciens',
				color: '#F68D2B',
				value:
					total === 0
						? 0
						: Math.round((oldMembers / (newMembers + oldMembers)) * 100),
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

export function calculateEntityTotals(entities: EntityWithStats[]) {
	return entities.reduce(
		(acc, entity) => ({
			newMembers: acc.newMembers + entity.newMembers,
			oldMembers: acc.oldMembers + entity.oldMembers,
		}),
		{ newMembers: 0, oldMembers: 0 },
	)
}
