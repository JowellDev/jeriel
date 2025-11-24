import { useMediaQuery } from 'usehooks-ts'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useFetcher } from '@remix-run/react'
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
import { MOBILE_WIDTH } from '~/shared/constants'
import type { ActionType } from '../../server/action.server'
import { EditServiceForm } from '../forms/edit-service-form'
import type { ServiceData } from '../../types'

interface Props {
	service?: ServiceData
	onClose: () => void
}

export function EditServiceDialog({ service, onClose }: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const isEdit = !!service

	const title = isEdit ? 'Modification du service' : 'Créer un service'
	const successMessage = isEdit
		? 'Service modifié avec succès.'
		: 'Service créé avec succès.'

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success(successMessage)
			onClose?.()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.state, fetcher.data, isEdit, onClose])

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
					<EditServiceForm
						isSubmitting={isSubmitting}
						fetcher={fetcher}
						service={service}
						onClose={onClose}
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
				<EditServiceForm
					isSubmitting={isSubmitting}
					fetcher={fetcher}
					service={service}
					className="px-4"
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
