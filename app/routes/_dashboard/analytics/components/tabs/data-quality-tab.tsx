import {
	RiUserSearchLine,
	RiShieldCheckLine,
	RiUserUnfollowLine,
} from '@remixicon/react'
import { Link } from '@remix-run/react'
import { KpiCard } from '~/components/stats/kpi-card'
import { Badge } from '~/components/ui/badge'
import type { DataQualityMetrics } from '../../types'
import { SectionCard, EmptyState } from '../section-card'
import { DistributionBars } from '../distribution-bars'

interface DataQualityTabProps {
	dataQuality: DataQualityMetrics
	isAdmin: boolean
}

export function DataQualityTab({
	dataQuality,
	isAdmin,
}: Readonly<DataQualityTabProps>) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
				<KpiCard
					label="Fiches complètes"
					value={`${dataQuality.completenessRate}%`}
					Icon={RiShieldCheckLine}
				/>
				<KpiCard
					label="Fiches incomplètes"
					value={dataQuality.incompleteCount}
					Icon={RiUserSearchLine}
				/>
				{isAdmin && (
					<KpiCard
						label="Non affectés"
						value={dataQuality.unassignedCount}
						Icon={RiUserUnfollowLine}
					/>
				)}
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<SectionCard
					title="Champs manquants"
					description="Répartition des données absentes"
					Icon={RiUserSearchLine}
				>
					<DistributionBars
						items={dataQuality.missingBreakdown}
						emptyMessage="Toutes les fiches sont complètes 🎉"
						barClassName="bg-warning"
					/>
				</SectionCard>

				<SectionCard
					title="Fiches à compléter"
					Icon={RiUserSearchLine}
				>
					{dataQuality.incompleteMembers.length === 0 ? (
						<EmptyState message="Aucune fiche incomplète." />
					) : (
						<ul className="space-y-2">
							{dataQuality.incompleteMembers.map(member => (
								<li
									key={member.id}
									className="flex items-center justify-between gap-2 text-sm"
								>
									<Link
										to={`/members/${member.id}/details`}
										className="line-clamp-1 text-foreground hover:text-primary hover:underline"
									>
										{member.name}
									</Link>
									<span className="flex flex-wrap justify-end gap-1">
										{member.missing.map(field => (
											<Badge key={field} variant="secondary">
												{field}
											</Badge>
										))}
									</span>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
			</div>

			{isAdmin && dataQuality.unassignedMembers.length > 0 && (
				<SectionCard
					title="Membres non affectés"
					description="Sans tribu, département ni famille d'honneur"
					Icon={RiUserUnfollowLine}
				>
					<ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
						{dataQuality.unassignedMembers.map(member => (
							<li key={member.id}>
								<Link
									to={`/members/${member.id}/details`}
									className="line-clamp-1 text-sm text-foreground hover:text-primary hover:underline"
								>
									{member.name}
								</Link>
							</li>
						))}
					</ul>
				</SectionCard>
			)}
		</div>
	)
}
