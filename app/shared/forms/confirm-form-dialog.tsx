import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { useFetcher } from '@remix-run/react'
import { Button } from '~/components/ui/button'
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

interface ConfirmDialogProps<T> {
	data: T
	onClose: () => void
	title: string
	message: string
	intent: string
	confirmText?: string
	cancelText?: string
	successMessage?: string
	formAction?: string
	variant?: 'destructive' | 'default' | 'outline' | 'secondary'
	titleClassName?: string
}

interface MainFormProps<T> {
	isSubmitting: boolean
	fetcher: ReturnType<typeof useFetcher<any>>
	data: T
	className?: string
	onClose?: () => void
	message: string
	intent: string
	confirmText: string
	cancelText: string
	formAction: string
	variant: 'destructive' | 'default' | 'outline' | 'secondary'
}

export function ConfirmDialog<T extends { id: string }>({
	data,
	onClose,
	title,
	message,
	intent,
	confirmText = 'Confirmer',
	cancelText = 'Fermer',
	successMessage,
	formAction,
	variant = 'destructive',
	titleClassName = 'text-red-500',
}: Readonly<ConfirmDialogProps<T>>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher()
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const actionPath = formAction ?? `${data.id}`

	useEffect(() => {
		if (
			fetcher.state === 'idle' &&
			(fetcher.data as { success: boolean })?.success
		) {
			const msg = successMessage ?? `Opération effectuée avec succès.`
			toast.success(msg, { duration: 5000 })
			onClose?.()
		}
	}, [fetcher.data, fetcher.state, onClose, successMessage])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle className={titleClassName}>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						fetcher={fetcher}
						className="px-4"
						data={data}
						isSubmitting={isSubmitting}
						onClose={onClose}
						message={message}
						intent={intent}
						confirmText={confirmText}
						cancelText={cancelText}
						formAction={actionPath}
						variant={variant}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onClose}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle className={titleClassName}>{title}</DrawerTitle>
				</DrawerHeader>
				<div className="px-2">
					<MainForm
						isSubmitting={isSubmitting}
						fetcher={fetcher}
						className="px-4"
						data={data}
						message={message}
						intent={intent}
						confirmText={confirmText}
						cancelText={cancelText}
						formAction={actionPath}
						variant={variant}
					/>
				</div>
				<DrawerFooter className="pt-2">
					<DrawerClose asChild>
						<Button variant="outline">{cancelText}</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}

const MainForm = <T extends { id: string }>({
	fetcher,
	className,
	isSubmitting,
	onClose,
	message,
	intent,
	confirmText,
	cancelText,
	formAction,
	variant,
}: Readonly<MainFormProps<T>>) => {
	return (
		<div>
			<div className="mt-4">{message}</div>
			<fetcher.Form
				method="post"
				action={formAction}
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
							{cancelText}
						</Button>
					)}

					<Button
						type="submit"
						name="intent"
						value={intent}
						variant={variant}
						disabled={isSubmitting}
						className="w-full sm:w-auto"
					>
						{confirmText}
					</Button>
				</div>
			</fetcher.Form>
		</div>
	)
}
