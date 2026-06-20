import { useMediaQuery } from 'usehooks-ts'

import { MOBILE_WIDTH } from '~/shared/constants'

/**
 * `true` lorsque le viewport est en dessous du breakpoint desktop.
 * S'appuie sur le même breakpoint que le reste de l'app (`MOBILE_WIDTH`).
 */
export function useIsMobile() {
	return !useMediaQuery(MOBILE_WIDTH)
}
