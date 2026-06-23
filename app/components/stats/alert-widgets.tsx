import {
	RiAlarmWarningLine,
	RiTimeLine,
	RiUserSearchLine,
} from '@remixicon/react'
import { KpiCard } from './kpi-card'

export interface AlertCounts {
	atRiskCount: number
	lateReportsCount: number
	incompleteCount: number
}

interface AlertWidgetsProps {
	alerts: AlertCounts | null
}

/**
 * Synthèse cliquable des alertes (membres à risque, rapports en retard,
 * fiches incomplètes) renvoyant vers l'onglet Analytique correspondant.
 */
export function AlertWidgets({ alerts }: Readonly<AlertWidgetsProps>) {
	if (!alerts) return null

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<KpiCard
				label="Membres à risque"
				value={alerts.atRiskCount}
				Icon={RiAlarmWarningLine}
				to="/analytics?tab=attendance"
				hint="Absents aux derniers cultes"
				trend={
					alerts.atRiskCount > 0
						? { label: 'À relancer', direction: 'down' }
						: { label: 'Tout est à jour', direction: 'up' }
				}
			/>
			<KpiCard
				label="Rapports en retard"
				value={alerts.lateReportsCount}
				Icon={RiTimeLine}
				to="/analytics?tab=reports"
				trend={
					alerts.lateReportsCount > 0
						? { label: 'En attente', direction: 'down' }
						: { label: 'Tous remis', direction: 'up' }
				}
			/>
			<KpiCard
				label="Fiches incomplètes"
				value={alerts.incompleteCount}
				Icon={RiUserSearchLine}
				to="/analytics?tab=quality"
				hint="Données manquantes"
			/>
		</div>
	)
}
