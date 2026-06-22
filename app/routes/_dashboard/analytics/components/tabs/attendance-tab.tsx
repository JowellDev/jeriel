import {
	RiAlarmWarningLine,
	RiCalendarCheckLine,
	RiCalendarCloseLine,
	RiUserHeartLine,
} from '@remixicon/react'
import { Link } from '@remix-run/react'
import { KpiCard } from '~/components/stats/kpi-card'
import type { AttendanceMetrics, EntityRanking } from '../../types'
import { SectionCard, EmptyState } from '../section-card'
import { AtRiskTable } from '../at-risk-table'
import { AttendanceHeatmap } from '../attendance-heatmap'

interface AttendanceTabProps {
	attendance: AttendanceMetrics
	isAdmin: boolean
}

function rateTrend(delta: number | null) {
	if (delta === null || delta === 0) return undefined
	return {
		label: `${delta > 0 ? '+' : ''}${delta} pts vs mois précédent`,
		direction: delta > 0 ? ('up' as const) : ('down' as const),
	}
}

const ENTITY_PATH: Record<EntityRanking['type'], string> = {
	tribe: '/tribes',
	department: '/departments',
	honorFamily: '/honor-families',
}

export function AttendanceTab({
	attendance,
	isAdmin,
}: Readonly<AttendanceTabProps>) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<KpiCard
					label="Taux de présence"
					value={`${attendance.attendanceRate}%`}
					Icon={RiUserHeartLine}
					trend={rateTrend(attendance.rateDelta)}
				/>
				<KpiCard label="Présences" value={attendance.presentCount} Icon={RiCalendarCheckLine} />
				<KpiCard label="Absences" value={attendance.absentCount} Icon={RiCalendarCloseLine} />
				<KpiCard
					label="Membres à risque"
					value={attendance.atRiskCount}
					Icon={RiAlarmWarningLine}
				/>
			</div>

			<SectionCard
				title="Membres à risque"
				description="Absents à tous les derniers cultes suivis"
				Icon={RiAlarmWarningLine}
			>
				<AtRiskTable members={attendance.atRiskMembers} />
			</SectionCard>

			<div className="grid gap-4 lg:grid-cols-2">
				<SectionCard
					title="Heatmap d'assiduité"
					description="Membre × dimanche"
					Icon={RiCalendarCheckLine}
					className={isAdmin ? '' : 'lg:col-span-2'}
				>
					<AttendanceHeatmap
						sundays={attendance.sundays}
						rows={attendance.heatmap}
					/>
				</SectionCard>

				{isAdmin && (
					<SectionCard
						title="Classement des entités"
						description="Par taux de présence"
						Icon={RiUserHeartLine}
					>
						<EntityRankingList ranking={attendance.ranking} />
					</SectionCard>
				)}
			</div>
		</div>
	)
}

function EntityRankingList({
	ranking,
}: Readonly<{ ranking: EntityRanking[] }>) {
	if (ranking.length === 0) {
		return <EmptyState message="Aucune entité à classer." />
	}

	return (
		<ul className="space-y-2.5">
			{ranking.map((entity, index) => (
				<li key={`${entity.type}-${entity.id}`} className="space-y-1">
					<div className="flex items-center justify-between text-xs">
						<Link
							to={ENTITY_PATH[entity.type]}
							className="flex items-center gap-1 font-medium text-foreground hover:text-primary hover:underline"
						>
							<span className="text-muted-foreground">{index + 1}.</span>
							{entity.name}
						</Link>
						<span className="text-muted-foreground">
							{entity.rate}% · {entity.memberCount} mbr.
						</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary"
							style={{ width: `${entity.rate}%` }}
						/>
					</div>
				</li>
			))}
		</ul>
	)
}
