import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import { Card } from '~/components/ui/card'

function getGreeting() {
	const hour = new Date().getHours()
	if (hour < 12) return 'Bonjour'
	if (hour < 18) return 'Bon après-midi'
	return 'Bonsoir'
}

export type HeroStat = {
	label: string
	value: string | number
	delta?: number | null
}

interface Props {
	userName?: string
	subtitle?: string
	stats?: HeroStat[]
}

export function WelcomeHero({
	userName,
	subtitle = "Voici un aperçu de votre communauté aujourd'hui.",
	stats = [],
}: Readonly<Props>) {
	const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })

	return (
		<Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary to-primary/80 p-6 text-white shadow-md sm:p-8">
			<div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
			<div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-gold/15 blur-3xl" />

			<div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div className="space-y-1.5">
					<p className="text-sm capitalize text-white/70">{today}</p>
					<h2 className="text-2xl font-bold sm:text-3xl">
						{getGreeting()}, {userName ?? ''} 👋
					</h2>
					<p className="text-sm text-white/85">{subtitle}</p>
				</div>

				{stats.length > 0 && (
					<div className="flex shrink-0 flex-wrap gap-3">
						{stats.map(stat => (
							<HeroStatItem key={stat.label} {...stat} />
						))}
					</div>
				)}
			</div>
		</Card>
	)
}

function HeroStatItem({ label, value, delta }: Readonly<HeroStat>) {
	return (
		<div className="min-w-[7.5rem] rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
			<p className="text-2xl font-bold leading-none">{value}</p>
			<p className="mt-1 text-xs text-white/75">{label}</p>
			{typeof delta === 'number' && delta !== 0 && (
				<p className="mt-1 text-xs font-medium text-white/90">
					{delta > 0 ? '▲' : '▼'} {Math.abs(delta)} pts vs mois dernier
				</p>
			)}
		</div>
	)
}
