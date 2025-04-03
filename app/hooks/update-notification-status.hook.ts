import { useFetcher } from '@remix-run/react'
import { useCallback } from 'react'

export function useUpdateNotificationStatus() {
	const { submit, ...fetcher } = useFetcher<{
		status: string
	}>()

	const success = fetcher.data?.status === 'success'

	const updateStatus = useCallback(
		function updateStatus() {
			submit({}, { method: 'POST', action: '/api/notifications' })
		},
		[submit],
	)

	return { success, updateStatus }
}
