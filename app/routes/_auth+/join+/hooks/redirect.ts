import { useSearchParams } from '@remix-run/react'
import { useEffect, useState } from 'react'

export function useRedirectTo() {
	const [searchParams] = useSearchParams()
	const [redirectTo, setRedirectTo] = useState(searchParams.get('redirectTo'))

	useEffect(() => {
		if (searchParams.get('redirectTo') !== redirectTo) {
			setRedirectTo(searchParams.get('redirectTo'))
		}
	}, [redirectTo, searchParams])

	return redirectTo
}
