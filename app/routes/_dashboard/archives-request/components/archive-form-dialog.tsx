import { useMediaQuery } from 'usehooks-ts'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '~/components/ui/drawer'
import { Button } from '~/components/ui/button'
import { useFetcher } from '@remix-run/react'
import type { ActionType } from '../action.server'
import type { ArchiveRequest } from '../model'
import { MOBILE_WIDTH } from '~/shared/constants'
import MainForm from './main-form'
import { useCallback, useEffect, useState } from 'react'
import type { AuthorizedEntity } from '../../dashboard/types'
import { buildSearchParams } from '../../../../utils/url'
import { useApiData } from '../../../../hooks/api-data.hook'
import type { GetAllMembersApiData } from '../../../api/get-all-members/_index'
import { toast } from 'sonner'

interface Props {
	onClose: () => void
	authorizedEntities: AuthorizedEntity[]
}

export function ArchiveFormDialog({ onClose, authorizedEntities }: Props) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()
	const [archiveRequest, setArchiveRequest] = useState<ArchiveRequest>({
		usersToArchive: [],
	})

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)
	const title = `Demande d'archive`

	const defaultEntity = authorizedEntities[0]
	const defaultParams = getEntityParams(defaultEntity)

	const apiData = useApiData<GetAllMembersApiData>(
		`/api/get-all-members?${defaultParams}`,
	)

	const getSelectedEntityMembers = useCallback(
		(entity?: AuthorizedEntity) => {
			if (!entity) return
			const params = getEntityParams(entity)
			apiData.refresh(params)
		},
		[apiData],
	)

	function getEntityParams(entity: AuthorizedEntity) {
		return buildSearchParams({
			...(entity.type === 'tribe' ? { tribeId: entity.id } : {}),
			...(entity.type === 'department' ? { departmentId: entity.id } : {}),
			...(entity.type === 'honorFamily' ? { honorFamilyId: entity.id } : {}),
			isAdmin: false,
			isActive: true,
		})
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success('Action effectuée avec succès.')
			onClose()
		}
	}, [fetcher.data, fetcher.state, onClose])

	useEffect(() => {
		if (apiData.data) {
			setArchiveRequest(prev => ({
				...prev,
				usersToArchive: apiData.data as unknown as any[],
			}))
		}
	}, [apiData.data])

	useEffect(() => {
		getSelectedEntityMembers(defaultEntity)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultEntity])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						isLoading={isSubmitting}
						archiveRequest={archiveRequest}
						fetcher={fetcher}
						onClose={onClose}
						authorizedEntities={authorizedEntities}
						onFilter={getSelectedEntityMembers}
						defaultEntity={defaultEntity}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onClose}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
				</DrawerHeader>
				<MainForm
					isLoading={isSubmitting}
					archiveRequest={archiveRequest}
					fetcher={fetcher}
					className="px-4"
					authorizedEntities={authorizedEntities}
					onFilter={getSelectedEntityMembers}
					defaultEntity={defaultEntity}
				/>
				<DrawerFooter className="pt-2">
					<DrawerClose asChild>
						<Button variant="outline">Fermer</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
