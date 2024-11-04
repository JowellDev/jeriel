import { useEffect, useState } from 'react'
import type { LoaderType } from '../loader.server'
import { useFetcher } from '@remix-run/react'
import type { SerializeFrom } from '@remix-run/node'

type LoaderReturnData = SerializeFrom<LoaderType>

export function useDashboard(loaderData: LoaderReturnData) {
	const [data, setData] = useState(loaderData)
	const { load, ...fetcher } = useFetcher<LoaderType>()

	function handleOnExport() {
		//
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	return {
		data,
		fetcher,
		handleOnExport,
	}
}
