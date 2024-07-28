import { useState, useEffect, useLayoutEffect, useCallback } from 'react'

interface Dimensions {
	width: number
	height: number
}

const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const useDimensions = (
	ref: React.RefObject<HTMLElement>,
): Dimensions | null => {
	const [dimensions, setDimensions] = useState<Dimensions | null>(null)

	const measure = useCallback(() => {
		if (ref.current) {
			setDimensions({
				width: ref.current.offsetWidth,
				height: ref.current.offsetHeight,
			})
		}
	}, [ref])

	useIsomorphicLayoutEffect(() => {
		measure()

		const resizeObserver = new ResizeObserver(() => {
			measure()
		})

		if (ref.current) {
			resizeObserver.observe(ref.current)
		}

		return () => {
			if (ref.current) {
				resizeObserver.unobserve(ref.current)
			}
		}
	}, [measure, ref])

	return dimensions
}
