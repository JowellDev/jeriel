import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import type { ServiceData } from '../types'
import { useFetcher } from '@remix-run/react'
import { type ActionType } from '../action.server'
import { Button } from '~/components/ui/button'
import { FORM_INTENT } from '../constants'
import { useMediaQuery } from 'usehooks-ts'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useEffect } from 'react'
import { toast } from 'sonner'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '~/components/ui/drawer'
import { cn } from '~/utils/ui'

interface Props {
	service: ServiceData
	onClose: () => void
}

interface MainFormProps {
	isSubmitting: boolean
	fetcher: ReturnType<typeof useFetcher<any>>
	service: ServiceData
	className?: string
	onClose?: () => void
}

export function ConfirmFormDialog({ service, onClose }: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Confirmation de suppression'

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success) {
			const message = `Service supprimé avec succès`
			toast.success(message, { duration: 5000 })
			onClose?.()
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
						<DialogTitle className="text-red-500">{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						fetcher={fetcher}
						className="px-4"
						service={service}
						isSubmitting={isSubmitting}
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
					<DrawerTitle className="text-red-500">{title}</DrawerTitle>
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

const MainForm = ({
	service,
	fetcher,
	className,
	isSubmitting,
	onClose,
}: Readonly<MainFormProps>) => {
	return (
		<div>
			<div className="mt-4">
				Voulez-vous vraiment supprimer ce service ? Cette action est
				irréversible.
			</div>
			<fetcher.Form
				method="post"
				action={`${service.id}`}
				className={cn('grid items-start gap-4 pt-4', className)}
			>
				<div className="sm:flex sm:items-start sm:justify-end sm:space-x-4 mt-4">
					{onClose && (
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isSubmitting}
						>
							Fermer
						</Button>
					)}

					<Button
						type="submit"
						name="intent"
						value={FORM_INTENT.DELETE}
						variant="destructive"
						disabled={isSubmitting}
						className="w-full sm:w-auto"
					>
						Confirmer
					</Button>
				</div>
			</fetcher.Form>
		</div>
	)
}
