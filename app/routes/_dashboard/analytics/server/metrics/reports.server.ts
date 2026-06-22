import { type Prisma, AttendanceReportEntity } from '@prisma/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { prisma } from '~/infrastructures/database/prisma.server'
import type {
	AnalyticsScope,
	EntityType,
	ReportMetrics,
	ReportRow,
} from '../../types'
import { percentage } from './utils'

const ENTITY_TYPE_MAP: Record<AttendanceReportEntity, EntityType> = {
	[AttendanceReportEntity.TRIBE]: 'tribe',
	[AttendanceReportEntity.DEPARTMENT]: 'department',
	[AttendanceReportEntity.HONOR_FAMILY]: 'honorFamily',
}

type TrackingRow = Prisma.ReportTrackingGetPayload<{
	include: {
		tribe: { select: { name: true } }
		department: { select: { name: true } }
		honorFamily: { select: { name: true } }
	}
}>

function buildReportWhere(
	scope: AnalyticsScope,
	from: Date,
	to: Date,
): Prisma.ReportTrackingWhereInput {
	const dateFilter = { createdAt: { gte: from, lte: to } }

	if (!scope.isAdmin && scope.selectedEntity) {
		const { type, id } = scope.selectedEntity
		return { ...dateFilter, [`${type}Id`]: id }
	}

	return {
		...dateFilter,
		OR: [
			{ tribe: { churchId: scope.churchId ?? undefined } },
			{ department: { churchId: scope.churchId ?? undefined } },
			{ honorFamily: { churchId: scope.churchId ?? undefined } },
		],
	}
}

function toReportRow(tracking: TrackingRow): ReportRow {
	const name =
		tracking.tribe?.name ??
		tracking.department?.name ??
		tracking.honorFamily?.name ??
		'Entité'

	return {
		id: tracking.id,
		type: ENTITY_TYPE_MAP[tracking.entity],
		name,
		submitted: tracking.submittedAt !== null,
		submittedAt: tracking.submittedAt
			? format(tracking.submittedAt, 'dd MMM yyyy', { locale: fr })
			: null,
	}
}

/** Taux de remise des rapports d'assiduité sur la période. */
export async function buildReportMetrics(
	scope: AnalyticsScope,
	from: Date,
	to: Date,
): Promise<ReportMetrics> {
	const trackings = await prisma.reportTracking.findMany({
		where: buildReportWhere(scope, from, to),
		include: {
			tribe: { select: { name: true } },
			department: { select: { name: true } },
			honorFamily: { select: { name: true } },
		},
		orderBy: { createdAt: 'desc' },
	})

	const rows = trackings.map(toReportRow)
	const submittedCount = rows.filter(r => r.submitted).length

	return {
		submissionRate: percentage(submittedCount, rows.length),
		submittedCount,
		totalExpected: rows.length,
		lateCount: rows.length - submittedCount,
		entities: rows,
	}
}
