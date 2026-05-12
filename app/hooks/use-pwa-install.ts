import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAInstallReturn {
	canInstall: boolean
	isIOS: boolean
	isInstalled: boolean
	isDismissed: boolean
	install: () => Promise<void>
	dismiss: () => void
}

const DISMISSED_KEY = 'pwa-install-dismissed'

export function usePWAInstall(): UsePWAInstallReturn {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null)
	const [isInstalled, setIsInstalled] = useState(false)
	const [isDismissed, setIsDismissed] = useState(false)
	const [isIOS, setIsIOS] = useState(false)

	useEffect(() => {
		const dismissed = localStorage.getItem(DISMISSED_KEY) === 'true'
		setIsDismissed(dismissed)

		const ios =
			/iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
		setIsIOS(ios)

		const standalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			('standalone' in window.navigator &&
				(window.navigator as { standalone?: boolean }).standalone === true)
		setIsInstalled(standalone)

		const handler = (e: Event) => {
			e.preventDefault()
			setDeferredPrompt(e as BeforeInstallPromptEvent)
		}

		window.addEventListener('beforeinstallprompt', handler)

		window.addEventListener('appinstalled', () => {
			setIsInstalled(true)
			setDeferredPrompt(null)
		})

		return () => window.removeEventListener('beforeinstallprompt', handler)
	}, [])

	const install = async () => {
		if (!deferredPrompt) return
		await deferredPrompt.prompt()
		const { outcome } = await deferredPrompt.userChoice
		if (outcome === 'accepted') {
			setIsInstalled(true)
		}
		setDeferredPrompt(null)
	}

	const dismiss = () => {
		localStorage.setItem(DISMISSED_KEY, 'true')
		setIsDismissed(true)
	}

	return {
		canInstall: !!deferredPrompt,
		isIOS,
		isInstalled,
		isDismissed,
		install,
		dismiss,
	}
}
