import StatsCard from './stats-card'
import {
	RiBuilding2Line,
	RiBuildingLine,
	RiHeartsLine,
	RiTeamLine,
} from '@remixicon/react'

export default function GlobalStats() {
	return (
		<div className="grid sm:grid-cols-2 gap-8">
			<StatsCard
				Icon={RiBuildingLine}
				title="Présence aux cultes"
				otherInfos="Date d'intégration 23 Mai 2023"
			>
				Content
			</StatsCard>
			<StatsCard
				Icon={RiBuilding2Line}
				title="Département | Communication"
				otherInfos="Date d'intégration 23 Mai 2023"
			>
				Content
			</StatsCard>
			<StatsCard
				Icon={RiHeartsLine}
				title="Famille d'honneur | Joseph"
				otherInfos="Date d'intégration 23 Mai 2023"
			>
				Content
			</StatsCard>
			<StatsCard
				Icon={RiTeamLine}
				title="Tribu | Naphtaliy"
				otherInfos="Date d'intégration 23 Mai 2023"
			>
				Content
			</StatsCard>
		</div>
	)
}
