import { useLocation, useMatches } from '@remix-run/react'
import { useMemo } from 'react'

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
	id: string,
): Record<string, unknown> | undefined {
	const matchingRoutes = useMatches()
	const route = useMemo(
		() => matchingRoutes.find(route => route.id === id),
		[matchingRoutes, id],
	)
	return route?.data as Record<string, unknown>
}

export function useRouteMatcher(pattern: string | RegExp) {
	const location = useLocation()

	if (typeof pattern === 'string') {
		return location.pathname.endsWith(pattern)
	} else {
		return pattern.test(location.pathname)
	}
}
