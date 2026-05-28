import type { AttendanceAdminStats, EntityWithStats } from '../types'

export function generateLineChartData(stats: AttendanceAdminStats[]) {
	return {
		data: stats,
		config: {
			presences: {
				label: 'Présence',
				color: '#B5EAE7',
			},
			absences: {
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
