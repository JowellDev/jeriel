import { RiCheckboxCircleLine, RiFileListLine, RiTimeLine } from '@remixicon/react'
import { KpiCard } from '~/components/stats/kpi-card'
import { Badge } from '~/components/ui/badge'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'
import type { ReportMetrics, ReportRow } from '../../types'
import { SectionCard, EmptyState } from '../section-card'

interface ReportsTabProps {
	reports: ReportMetrics
}

const TYPE_LABEL: Record<ReportRow['type'], string> = {
	tribe: 'Tribu',
	department: 'Département',
	honorFamily: "Famille d'honneur",
}

export function ReportsTab({ reports }: Readonly<ReportsTabProps>) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
				<KpiCard
					label="Taux de remise"
					value={`${reports.submissionRate}%`}
					Icon={RiCheckboxCircleLine}
				/>
				<KpiCard label="Rapports remis" value={reports.submittedCount} Icon={RiFileListLine} />
				<KpiCard label="En retard" value={reports.lateCount} Icon={RiTimeLine} />
			</div>

			<SectionCard
				title="Suivi des rapports"
				description="Remise par entité sur la période"
				Icon={RiFileListLine}
			>
				{reports.entities.length === 0 ? (
					<EmptyState message="Aucun rapport attendu sur cette période." />
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Entité</TableHead>
								<TableHead className="hidden sm:table-cell">Type</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead className="text-right">Remis le</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{reports.entities.map(entity => (
								<TableRow key={entity.id}>
									<TableCell className="font-medium text-foreground">
										{entity.name}
									</TableCell>
									<TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
										{TYPE_LABEL[entity.type]}
									</TableCell>
									<TableCell>
										{entity.submitted ? (
											<Badge variant="success">Remis</Badge>
										) : (
											<Badge variant="warning">En attente</Badge>
										)}
									</TableCell>
									<TableCell className="text-right text-sm text-muted-foreground">
										{entity.submittedAt ?? '—'}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</SectionCard>
		</div>
	)
}
