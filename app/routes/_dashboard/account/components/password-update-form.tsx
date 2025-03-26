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
import { cn } from '~/utils/ui'
import { useFetcher } from '@remix-run/react'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import PasswordInputField from '~/components/form/password-input-field'
import { useEffect } from 'react'
import { MOBILE_WIDTH } from '~/shared/constants'
import { schema } from '../schema'
import { type ActionType } from '../action.server'
import { toast } from 'sonner'

interface Props {
	onClose: () => void
}

export function PasswordUpdateForm({ onClose }: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Modification de mot de passe'

	useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle' && fetcher.data.success) {
			onClose()
			toast.success('Modification effectuée avec succès!')
		}
	}, [fetcher.data, fetcher.state, onClose])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="sm:max-w-[625px]"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						isLoading={isSubmitting}
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
				<MainForm isLoading={isSubmitting} fetcher={fetcher} className="px-4" />
				<DrawerFooter className="pt-2">
					<DrawerClose asChild>
						<Button variant="outline">Fermer</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}

function MainForm({
	className,
	isLoading,
	fetcher,
	onClose,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
}) {
	const [form, fields] = useForm({
		id: 'password-update-form',
		constraint: getZodConstraint(schema),
		lastResult: fetcher.data?.lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action="."
			className={cn('grid items-start gap-4 mt-4', className)}
			autoComplete="off"
		>
			<PasswordInputField
				label="Mot de passe actuel"
				field={fields.currentPassword}
				InputProps={{ autoComplete: 'current-password' }}
			/>
			<PasswordInputField
				label="Nouveau mot de passe"
				field={fields.newPassword}
				InputProps={{ autoComplete: 'new-password' }}
			/>
			<PasswordInputField
				label="Confirmer le mot de passe"
				field={fields.passwordConfirm}
			/>
			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					name="intent"
					variant="primary"
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Enregister
				</Button>
			</div>
		</fetcher.Form>
	)
}
