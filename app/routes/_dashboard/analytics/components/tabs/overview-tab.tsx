import {
	RiCakeLine,
	RiGroupLine,
	RiPulseLine,
	RiUserAddLine,
} from '@remixicon/react'
import { KpiCard } from '~/components/stats/kpi-card'
import type {
	BirthdayMember,
	EngagementMetrics,
	OverviewMetrics,
} from '../../types'
import { SectionCard, EmptyState } from '../section-card'
import { DistributionBars } from '../distribution-bars'

interface OverviewTabProps {
	overview: OverviewMetrics
	engagement: EngagementMetrics
	birthdays: BirthdayMember[]
}

function growthTrend(delta: number) {
	if (delta === 0) return undefined
	return {
		label: `${delta > 0 ? '+' : ''}${delta} vs période précédente`,
		direction: delta > 0 ? ('up' as const) : ('down' as const),
	}
}

export function OverviewTab({
	overview,
	engagement,
	birthdays,
}: Readonly<OverviewTabProps>) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<KpiCard label="Effectif total" value={overview.totalMembers} Icon={RiGroupLine} />
				<KpiCard
					label="Nouveaux"
					value={overview.newMembers}
					Icon={RiUserAddLine}
					trend={growthTrend(overview.growthDelta)}
				/>
				<KpiCard label="Anciens" value={overview.oldMembers} Icon={RiGroupLine} />
				<KpiCard
					label="Engagement moyen"
					value={`${engagement.average}/100`}
					Icon={RiPulseLine}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<SectionCard title="Répartition par sexe">
					<DistributionBars items={overview.genderDistribution} />
				</SectionCard>
				<SectionCard title="Tranches d'âge">
					<DistributionBars
						items={overview.ageDistribution}
						barClassName="bg-chart-2"
					/>
				</SectionCard>
				<SectionCard title="Statut matrimonial">
					<DistributionBars
						items={overview.maritalDistribution}
						barClassName="bg-chart-4"
					/>
				</SectionCard>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<SectionCard
					title="Croissance (6 mois)"
					Icon={RiUserAddLine}
					className="lg:col-span-1"
				>
					<DistributionBars
						items={overview.monthlyGrowth.map(m => ({
							label: m.month,
							value: m.count,
						}))}
						emptyMessage="Aucune arrivée récente"
						barClassName="bg-primary"
					/>
				</SectionCard>

				<SectionCard title="Top engagement" Icon={RiPulseLine}>
					{engagement.topMembers.length === 0 ? (
						<EmptyState message="Pas encore de données." />
					) : (
						<ul className="space-y-2">
							{engagement.topMembers.slice(0, 6).map(member => (
								<li
									key={member.id}
									className="flex items-center justify-between text-sm"
								>
									<span className="line-clamp-1 text-foreground">{member.name}</span>
									<span className="font-semibold text-primary">{member.score}</span>
								</li>
							))}
						</ul>
					)}
				</SectionCard>

				<SectionCard
					title="Anniversaires à venir"
					description="30 prochains jours"
					Icon={RiCakeLine}
				>
					{birthdays.length === 0 ? (
						<EmptyState message="Aucun anniversaire à venir." />
					) : (
						<ul className="space-y-2">
							{birthdays.slice(0, 6).map(member => (
								<li
									key={member.id}
									className="flex items-center justify-between text-sm"
								>
									<span className="line-clamp-1 text-foreground">{member.name}</span>
									<span className="text-xs capitalize text-muted-foreground">
										{member.day}
									</span>
								</li>
							))}
						</ul>
					)}
				</SectionCard>
			</div>
		</div>
	)
}
