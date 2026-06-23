import { useEffect } from 'react'
import { useFetcher } from '@remix-run/react'
import { useMediaQuery } from 'usehooks-ts'
import { toast } from 'sonner'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from '~/components/ui/drawer'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { MOBILE_WIDTH } from '~/shared/constants'

interface Props {
	requestId: string
	onClose: () => void
}

export function RejectRequestDialog({ requestId, onClose }: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<{ success?: boolean; message?: string }>()
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success) {
			toast.success(fetcher.data.message ?? 'Demande rejetée avec succès.')
			onClose()
		}
	}, [fetcher.state, fetcher.data, onClose])

	const form = (
		<fetcher.Form
			method="post"
			action={requestId}
			className="grid items-start gap-4 px-1 pt-2"
		>
			<p className="text-sm text-muted-foreground">
				Voulez-vous vraiment rejeter cette demande d&apos;archivage ? Les membres
				concernés redeviendront disponibles pour de nouvelles demandes.
			</p>
			<div className="space-y-1.5">
				<label htmlFor="reject-comment" className="text-sm font-medium">
					Commentaire (optionnel)
				</label>
				<Textarea
					id="reject-comment"
					name="comment"
					placeholder="Motif du rejet, visible par le demandeur…"
					rows={5}
					className="min-h-[120px]"
				/>
			</div>
			<div className="flex justify-end gap-3 pt-2">
				<Button
					type="button"
					variant="outline"
					onClick={onClose}
					disabled={isSubmitting}
				>
					Annuler
				</Button>
				<Button
					type="submit"
					name="intent"
					value="reject"
					variant="destructive"
					disabled={isSubmitting}
				>
					Rejeter
				</Button>
			</div>
		</fetcher.Form>
	)

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle className="text-red-500">
							Rejeter la demande
						</DialogTitle>
					</DialogHeader>
					{form}
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onClose}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle className="text-red-500">
						Rejeter la demande
					</DrawerTitle>
				</DrawerHeader>
				<div className="px-4 pb-6">{form}</div>
			</DrawerContent>
		</Drawer>
	)
}
