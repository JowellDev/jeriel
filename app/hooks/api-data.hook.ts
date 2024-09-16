import { useState, useEffect, useCallback } from 'react'

interface ApiResponse<T> {
	data: T | null
	isLoading: boolean
	error: unknown
	refresh: (queryParams?: URLSearchParams) => void
}

export const useApiData = <T>(baseUrl: string): ApiResponse<T> => {
	const [data, setData] = useState<T | null>(null)
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [error, setError] = useState<unknown>(null)
	const [refreshIndex, setRefreshIndex] = useState<number>(0)
	const [params, setParams] = useState<URLSearchParams>(new URLSearchParams())

	const fetchData = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const url = `${baseUrl}?${params}`
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error('Failed to fetch data')
			}
			const responseData: T = (await response.json()) as T
			setData(responseData)
		} catch (error) {
			setError(error)
		} finally {
			setIsLoading(false)
		}
	}, [baseUrl, params])

	useEffect(() => {
		fetchData()
	}, [fetchData, refreshIndex])

	const refresh = (queryParams = new URLSearchParams()) => {
		setParams(queryParams)
		setRefreshIndex(prevIndex => prevIndex + 1)
	}

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
