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

	const title = department ? `Modifier le département` : 'Nouveau département'

	useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle' && !fetcher.data.error) {
			onClose()
		} else if (fetcher.data && fetcher.state === 'idle' && fetcher.data.error) {
			const errorMessage = Array.isArray(fetcher.data.error)
				? fetcher.data.error.join(', ')
				: fetcher.data.error

			toast.error(errorMessage, { duration: 80000 })
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
