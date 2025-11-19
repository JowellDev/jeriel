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
import { MOBILE_WIDTH } from '~/shared/constants'
import MainForm from './main-form'
import { toast } from 'sonner'
import { useEffect } from 'react'
import type { ServiceData } from '../types'

interface Props {
	onClose: () => void
	service?: ServiceData
}

export function ServiceFormDialog({ service, onClose }: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()

	const isEdit = !!service
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)
	const title = isEdit ? 'Modification du service' : 'Nouveau serrvice'

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success) {
			const message = `Service ${isEdit ? 'modifié' : 'ajouté'} avec succès.`
			toast.success(message, { duration: 5000 })
			onClose?.()
		}
	}, [fetcher.data, fetcher.state, isEdit, onClose])

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
						isSubmitting={isSubmitting}
						fetcher={fetcher}
						onClose={onClose}
						service={service}
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
					isSubmitting={isSubmitting}
					fetcher={fetcher}
					className="px-4"
					service={service}
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
