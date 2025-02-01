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
import { useEffect } from 'react'
import type { AuthorizedEntity } from '../../dashboard/types'

interface Props {
	onClose: () => void
	archiveRequest: ArchiveRequest
	authorizedEntities: AuthorizedEntity[]
	onFilter: (entity?: AuthorizedEntity) => void
	defaultEntity: AuthorizedEntity
}

export function ArchiveFormDialog({
	onClose,
	archiveRequest,
	authorizedEntities,
	onFilter,
	defaultEntity,
}: Props) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = `Demande d'archive`

	useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle' && !fetcher.data.error) {
			onClose()
		}
	}, [fetcher.data, fetcher.state, onClose])

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
						onFilter={onFilter}
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
					onFilter={onFilter}
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
