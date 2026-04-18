import { useState, useEffect, useCallback } from 'react'

interface ApiResponse<T> {
	data: T | null
	isLoading: boolean
	error: unknown
	refresh: (queryParams?: URLSearchParams) => void
}

export const useApiData = <T>(initialUrl: string): ApiResponse<T> => {
	const [data, setData] = useState<T | null>(null)
	const [isLoading, setIsLoading] = useState<boolean>(!!initialUrl)
	const [error, setError] = useState<unknown>(null)
	const [currentUrl, setCurrentUrl] = useState<string>(initialUrl)

	useEffect(() => {
		if (!currentUrl) return

		const controller = new AbortController()
		setIsLoading(true)
		setError(null)

		fetch(currentUrl, { signal: controller.signal })
			.then(res => {
				if (!res.ok) throw new Error('Failed to fetch data')
				return res.json() as Promise<T>
			})
			.then(responseData => setData(responseData))
			.catch(err => {
				if (err.name !== 'AbortError') setError(err)
			})
			.finally(() => setIsLoading(false))

		return () => controller.abort()
	}, [currentUrl])

	const refresh = useCallback(
		(queryParams = new URLSearchParams()) => {
			const base = initialUrl.split('?')[0]
			setCurrentUrl(`${base}?${queryParams}`)
		},
		[initialUrl],
	)

	return { data, isLoading, error, refresh }
}

export function transformApiData<
	T extends { id: string; name: string; phone: string },
>(data: T[]) {
	return data.map(({ id, name, phone }) => ({
		value: id,
		label: name ?? phone,
	}))
}
