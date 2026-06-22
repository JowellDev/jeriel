import { useCallback } from 'react'
import { useSearchParams } from '@remix-run/react'

type ParamPatch = Record<string, string | undefined>

/**
 * Met à jour les query params de la page Analytique tout en conservant les
 * autres filtres. Toute modification déclenche un re-chargement du loader.
 */
export function useAnalyticsNav() {
	const [searchParams, setSearchParams] = useSearchParams()

	const update = useCallback(
		(patch: ParamPatch) => {
			setSearchParams(
				prev => {
					const next = new URLSearchParams(prev)
					for (const [key, value] of Object.entries(patch)) {
						if (value === undefined) next.delete(key)
						else next.set(key, value)
					}
					return next
				},
				{ preventScrollReset: true },
			)
		},
		[setSearchParams],
	)

	return { searchParams, update }
}
