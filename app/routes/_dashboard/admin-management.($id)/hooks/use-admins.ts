import { useCallback, useEffect, useState } from 'react'
import { useFetcher, useLocation, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import { type LoaderType } from '../server/loader.server'
import { FORM_INTENT, speedDialItemsActions } from '../constants'
import { useDownloadFile } from '~/shared/hooks'
import { toast } from 'sonner'

type LoaderReturnedData = Awaited<ReturnType<LoaderType>>

export function useAdmins(loaderData: LoaderReturnedData) {
	const [data, setData] = useState(loaderData)
	const [isExporting, setIsExporting] = useState(false)
	const [openAddForm, setOpenAddForm] = useState(false)
	const [adminToRemove, setAdminToRemove] = useState<{
		id: string
		name: string
	} | null>(null)
	const [adminToResetPassword, setAdminToResetPassword] = useState<{
		id: string
		name: string
	} | null>(null)

	const location = useLocation()
	const [searchParams, setSearchParams] = useSearchParams()
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const removeFetcher = useFetcher()
	const resetPasswordFetcher = useFetcher()
	const debounced = useDebounceCallback(setSearchParams, 500)

	useDownloadFile({ ...fetcher, load }, { isExporting, setIsExporting })

	const reloadData = useCallback(
		(option: typeof data.filterData) => {
			const params = buildSearchParams(option)
			load(`${location.pathname}?${params}`)
		},
		[data, load, location.pathname],
	)

	const handleClose = () => {
		setOpenAddForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterData,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	const handleDisplayMore = () => {
		reloadData({ ...data.filterData, take: data.filterData.take + 15 })
	}

	const handleExport = () => {
		setIsExporting(true)
		fetcher.submit({ intent: FORM_INTENT.EXPORT }, { method: 'post' })
	}

	const handleSpeedDialItemClick = (action: string) => {
		if (action === speedDialItemsActions.ADD_ADMIN) setOpenAddForm(true)
	}

	const handleRemoveAdmin = (userId: string, userName: string) => {
		setAdminToRemove({ id: userId, name: userName })
	}

	const confirmRemoveAdmin = () => {
		if (!adminToRemove) return

		removeFetcher.submit(
			{
				intent: FORM_INTENT.REMOVE_ADMIN,
				userId: adminToRemove.id,
			},
			{ method: 'post' },
		)
	}

	const cancelRemoveAdmin = () => {
		setAdminToRemove(null)
	}

	const handleResetPassword = (userId: string, userName: string) => {
		setAdminToResetPassword({ id: userId, name: userName })
	}

	const confirmResetPassword = (newPassword: string) => {
		if (!adminToResetPassword) return

		resetPasswordFetcher.submit(
			{
				intent: FORM_INTENT.RESET_PASSWORD,
				userId: adminToResetPassword.id,
				password: newPassword,
			},
			{ method: 'post' },
		)
	}

	const cancelResetPassword = () => {
		setAdminToResetPassword(null)
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data as unknown as LoaderReturnedData)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		if (searchParams.toString()) {
			load(`${location.pathname}?${searchParams.toString()}`)
		}
	}, [searchParams, location.pathname, load])

	// Handle remove admin success/error
	useEffect(() => {
		if (
			removeFetcher.state === 'idle' &&
			removeFetcher.data &&
			typeof removeFetcher.data === 'object' &&
			removeFetcher.data !== null &&
			'status' in removeFetcher.data &&
			removeFetcher.data.status === 'success'
		) {
			toast.success('Rôle administrateur retiré avec succès')
			setAdminToRemove(null)
			reloadData({ ...data.filterData, page: 1 })
		}

		if (
			removeFetcher.state === 'idle' &&
			removeFetcher.data &&
			typeof removeFetcher.data === 'object' &&
			removeFetcher.data !== null &&
			'status' in removeFetcher.data &&
			removeFetcher.data.status === 'error'
		) {
			const errorMessage =
				'message' in removeFetcher.data &&
				typeof removeFetcher.data.message === 'string'
					? removeFetcher.data.message
					: 'Une erreur est survenue'
			toast.error(errorMessage)
			setAdminToRemove(null)
		}
	}, [removeFetcher.state, removeFetcher.data, reloadData, data.filterData])

	// Handle reset password success/error
	useEffect(() => {
		if (
			resetPasswordFetcher.state === 'idle' &&
			resetPasswordFetcher.data &&
			typeof resetPasswordFetcher.data === 'object' &&
			resetPasswordFetcher.data !== null &&
			'status' in resetPasswordFetcher.data &&
			resetPasswordFetcher.data.status === 'success'
		) {
			toast.success('Mot de passe réinitialisé avec succès')
			setAdminToResetPassword(null)
			reloadData({ ...data.filterData, page: 1 })
		}

		if (
			resetPasswordFetcher.state === 'idle' &&
			resetPasswordFetcher.data &&
			typeof resetPasswordFetcher.data === 'object' &&
			resetPasswordFetcher.data !== null &&
			'status' in resetPasswordFetcher.data &&
			resetPasswordFetcher.data.status === 'error'
		) {
			const errorMessage =
				'message' in resetPasswordFetcher.data &&
				typeof resetPasswordFetcher.data.message === 'string'
					? resetPasswordFetcher.data.message
					: 'Une erreur est survenue'
			toast.error(errorMessage)
			setAdminToResetPassword(null)
		}
	}, [
		resetPasswordFetcher.state,
		resetPasswordFetcher.data,
		reloadData,
		data.filterData,
	])

	return {
		data,
		openAddForm,
		isExporting,
		adminToRemove,
		adminToResetPassword,
		isRemovingAdmin: removeFetcher.state !== 'idle',
		isResettingPassword: resetPasswordFetcher.state !== 'idle',
		handleClose,
		handleSearch,
		handleExport,
		handleDisplayMore,
		setOpenAddForm,
		handleSpeedDialItemClick,
		handleRemoveAdmin,
		confirmRemoveAdmin,
		cancelRemoveAdmin,
		handleResetPassword,
		confirmResetPassword,
		cancelResetPassword,
	}
}
