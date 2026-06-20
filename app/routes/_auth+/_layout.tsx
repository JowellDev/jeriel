import { Outlet } from '@remix-run/react'
import {
	RiBarChartBoxLine,
	RiCalendarCheckLine,
	RiGroupLine,
	type RemixiconComponentType,
} from '@remixicon/react'

import { loaderFn } from './loader.server'

export const loader = loaderFn

const FEATURES: { Icon: RemixiconComponentType; label: string }[] = [
	{ Icon: RiGroupLine, label: 'Gestion des fidèles & responsables' },
	{ Icon: RiCalendarCheckLine, label: 'Suivi des présences en temps réel' },
	{ Icon: RiBarChartBoxLine, label: 'Rapports & statistiques détaillés' },
]

export default function AuthLayout() {
	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			{/* Panneau de marque (desktop) */}
			<aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:w-[55%]">
				{/* Image de fond */}
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{ backgroundImage: "url('/images/auth-bg.png')" }}
				/>
				{/* Voile teal allégé : l'image reste visible tout en gardant l'identité */}
				<div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/65 to-primary/35" />
				{/* Formes décoratives floutées */}
				<div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
				<div className="absolute -bottom-16 right-0 h-80 w-80 rounded-full bg-gold/25 blur-3xl" />

				{/* Logo */}
				<div className="relative z-10">
					<img
						src="/images/white-logo-vh.png"
						alt="Jeriel"
						className="h-12 w-auto drop-shadow"
					/>
				</div>

				{/* Accroche + points forts */}
				<div className="relative z-10 max-w-lg space-y-8">
					<div className="space-y-3">
						<h2 className="text-4xl font-bold leading-tight drop-shadow-sm">
							Gérez votre communauté en toute sérénité
						</h2>
						<p className="text-base text-white/85">
							Membres, tribus, départements, familles d'honneur, présences et
							rapports — tout au même endroit.
						</p>
					</div>
					<ul className="space-y-4">
						{FEATURES.map(({ Icon, label }) => (
							<li key={label} className="flex items-center gap-3">
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
									<Icon size={20} />
								</span>
								<span className="text-sm font-medium text-white/90">
									{label}
								</span>
							</li>
						))}
					</ul>
				</div>

				<div className="relative z-10 text-xs text-white/60">
					© {new Date().getFullYear()} Jeriel
				</div>
			</aside>

			{/* Zone formulaire */}
			<main className="flex w-full flex-1 items-center justify-center overflow-y-auto bg-background p-6 sm:p-12">
				<div className="w-full max-w-md space-y-8">
					<div className="flex justify-center lg:hidden">
						<img
							src="/images/green-logo-vh.png"
							alt="Jeriel"
							className="h-14 w-auto"
						/>
					</div>
					<Outlet />
				</div>
			</main>
		</div>
	)
}
