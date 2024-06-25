import { useNavigation } from '@remix-run/react'
import { useMemo } from 'react'

export default function useSubmitting() {
	const { state } = useNavigation()

	const isSubmitting = useMemo(() => ['submitting'].includes(state), [state])

	return isSubmitting
}
