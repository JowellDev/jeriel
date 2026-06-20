import { Outlet } from '@remix-run/react'
import { loaderFn } from './loader.server'

export const loader = loaderFn

export default function AuthLayout() {
	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			{/* Panneau de marque (desktop) */}
			<aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
				<div
					className="absolute inset-0 bg-cover bg-center opacity-20"
					style={{ backgroundImage: "url('/images/auth-bg.png')" }}
				/>
				<div className="absolute inset-0 bg-gradient-to-br from-primary/70 to-primary" />
				<div className="relative z-10">
					<img
						src="/images/white-logo-vh.png"
						alt="Jeriel"
						className="h-12 w-auto"
					/>
				</div>
				<div className="relative z-10 space-y-3">
					<h2 className="text-3xl font-bold leading-tight">
						Gérez votre communauté en toute sérénité
					</h2>
					<p className="max-w-md text-sm text-primary-foreground/80">
						Membres, tribus, départements, familles d'honneur, présences et
						rapports — tout au même endroit.
					</p>
				</div>
				<div className="relative z-10 text-xs text-primary-foreground/60">
					© {new Date().getFullYear()} Jeriel
				</div>
			</aside>

			{/* Zone formulaire */}
			<main className="flex w-full flex-1 items-center justify-center overflow-y-auto p-6 sm:p-12">
				<div className="w-full max-w-md space-y-6">
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
