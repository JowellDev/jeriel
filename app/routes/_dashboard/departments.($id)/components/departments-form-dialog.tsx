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
import type { Department } from '../model'
import { MOBILE_WIDTH } from '~/shared/constants'
import MainForm from './main-form'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface Props {
	onClose: () => void
	department?: Department
}

export function DepartmentsFormDialog({ onClose, department }: Props) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const isEdit = !!department
	const title = isEdit ? `Modification du département` : 'Nouveau département'
	const successMessage = isEdit
		? 'Département modifié avec succès.'
		: 'Département créé avec succès.'

	useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle' && !fetcher.data.error) {
			onClose()
			toast.success(successMessage)
			toast.success('Modification effectuée avec succès.')
		} else if (fetcher.data && fetcher.state === 'idle' && fetcher.data.error) {
			const errorMessage = Array.isArray(fetcher.data.error)
				? fetcher.data.error.join(', ')
				: fetcher.data.error

			toast.error(errorMessage, { duration: 80000 })
		}
	}, [fetcher.data, fetcher.state, onClose, successMessage])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl overflow-y-auto max-h-[calc(100vh-10px)]"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						isLoading={isSubmitting}
						department={department}
						fetcher={fetcher}
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
				<MainForm
					isLoading={isSubmitting}
					department={department}
					fetcher={fetcher}
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
