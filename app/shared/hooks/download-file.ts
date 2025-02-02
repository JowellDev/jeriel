import { useEffect } from 'react'
import type { FetcherWithComponents } from '@remix-run/react'

interface DownloadState {
	isExporting: boolean
	setIsExporting: (value: boolean) => void
}

interface DownloadResponse {
	success: boolean
	fileLink?: string
}

export function useDownloadFile(
	fetcher: FetcherWithComponents<any>,
	{ setIsExporting }: DownloadState,
) {
	useEffect(() => {
		if (!fetcher.data || fetcher.state !== 'idle') return

		const response = fetcher.data as DownloadResponse
		if (!response.success) return

		setIsExporting(false)

		if (response.fileLink) {
			const link = document.createElement('a')
			link.href = response.fileLink
			link.style.display = 'none'
			document.body.appendChild(link)

			try {
				link.click()
			} finally {
				document.body.removeChild(link)
			}
		}
	}, [fetcher.state, fetcher.data, setIsExporting])
}
