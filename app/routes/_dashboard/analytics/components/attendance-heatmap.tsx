import { Link } from '@remix-run/react'
import { cn } from '~/utils/ui'
import type { HeatmapRow } from '../types'
import { EmptyState } from './section-card'

interface AttendanceHeatmapProps {
	sundays: string[]
	rows: HeatmapRow[]
}

const CELL_STYLE: Record<'present' | 'absent' | 'unknown', string> = {
	present: 'bg-success/80',
	absent: 'bg-destructive/70',
	unknown: 'bg-muted',
}

function cellClass(value: boolean | null): string {
	if (value === true) return CELL_STYLE.present
	if (value === false) return CELL_STYLE.absent
	return CELL_STYLE.unknown
}

/** Heatmap membre × dimanche (présent / absent / inconnu). */
export function AttendanceHeatmap({
	sundays,
	rows,
}: Readonly<AttendanceHeatmapProps>) {
	if (rows.length === 0 || sundays.length === 0) {
		return <EmptyState message="Pas encore de données d'assiduité." />
	}

	return (
		<div className="space-y-3">
			<Legend />
			<div className="overflow-x-auto">
				<table className="w-full border-separate border-spacing-1">
					<thead>
						<tr>
							<th className="sticky left-0 bg-card" />
							{sundays.map(day => (
								<th
									key={day}
									className="px-1 text-[10px] font-medium text-muted-foreground"
								>
									{day}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map(row => (
							<tr key={row.id}>
								<td className="sticky left-0 z-10 bg-card pr-2">
									<Link
										to={`/members/${row.id}/details`}
										className="line-clamp-1 max-w-[140px] text-xs text-foreground hover:text-primary hover:underline"
									>
										{row.name}
									</Link>
								</td>
								{row.cells.map((cell, index) => (
									<td key={index}>
										<div
											className={cn('h-4 w-4 rounded-sm', cellClass(cell))}
											title={`${row.name} · ${sundays[index]}`}
										/>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

function Legend() {
	return (
		<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
			<LegendItem className={CELL_STYLE.present} label="Présent" />
			<LegendItem className={CELL_STYLE.absent} label="Absent" />
			<LegendItem className={CELL_STYLE.unknown} label="Non renseigné" />
		</div>
	)
}

function LegendItem({
	className,
	label,
}: Readonly<{ className: string; label: string }>) {
	return (
		<span className="flex items-center gap-1">
			<span className={cn('h-3 w-3 rounded-sm', className)} />
			{label}
		</span>
	)
}
