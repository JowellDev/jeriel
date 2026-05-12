import { motion, AnimatePresence } from 'framer-motion'
import { RiDownloadLine, RiCloseLine, RiShareLine } from '@remixicon/react'
import { usePWAInstall } from '~/hooks/use-pwa-install'
import { Button } from '~/components/ui/button'

export function PWAInstallPrompt() {
	const { canInstall, isIOS, isInstalled, isDismissed, install, dismiss } =
		usePWAInstall()

	const visible = !isInstalled && !isDismissed && (canInstall || isIOS)

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{ type: 'spring', damping: 25, stiffness: 300 }}
					className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm md:left-auto md:right-6 md:max-w-xs"
				>
					<div className="rounded-2xl border border-[#E9C724]/30 bg-white shadow-xl shadow-black/10">
						<div className="flex items-start gap-3 p-4">
							<img
								src="/images/favicon.png"
								alt="Jériel"
								className="h-12 w-12 shrink-0 rounded-xl"
							/>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-gray-900">
									Installer Jériel
								</p>
								<p className="mt-0.5 text-xs text-gray-500">
									{isIOS
										? "Ajoutez l'app à votre écran d'accueil pour un accès rapide."
										: "Installez l'app pour une meilleure expérience."}
								</p>

								{isIOS ? (
									<div className="mt-2 flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-xs text-gray-600">
										<span>Appuyez sur</span>
										<RiShareLine className="h-3.5 w-3.5 shrink-0 text-blue-500" />
										<span>puis</span>
										<span className="font-medium">"Sur l'écran d'accueil"</span>
									</div>
								) : (
									<Button
										size="sm"
										className="mt-2 h-7 w-full rounded-lg bg-[#E9C724] text-xs font-medium text-gray-900 hover:bg-[#E9C724]/90"
										onClick={install}
									>
										<RiDownloadLine className="mr-1 h-3.5 w-3.5" />
										Installer
									</Button>
								)}
							</div>
							<button
								onClick={dismiss}
								className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
								aria-label="Fermer"
							>
								<RiCloseLine className="h-4 w-4" />
							</button>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
