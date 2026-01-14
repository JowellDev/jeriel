import * as React from 'react'
import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { resetPasswordSchema } from '../../schema'
import { ButtonLoading } from '~/components/button-loading'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { MOBILE_WIDTH } from '~/shared/constants'
import { cn } from '~/utils/ui'

interface Props {
	admin: { id: string; name: string }
	isLoading: boolean
	onConfirm: (password: string) => void
	onCancel: () => void
}

interface MainFormProps extends React.ComponentProps<'form'> {
	admin: { id: string; name: string }
	isLoading: boolean
	onConfirm: (password: string) => void
	onCancel?: () => void
}

function MainForm({
	admin,
	isLoading,
	onConfirm,
	onCancel,
	className,
}: Readonly<MainFormProps>) {
	const [showPassword, setShowPassword] = useState(false)

	const [form, fields] = useForm({
		id: 'reset-password-form',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: resetPasswordSchema })
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	})

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		const formData = new FormData(e.currentTarget)
		const submission = parseWithZod(formData, { schema: resetPasswordSchema })

		if (submission.status === 'success') {
			onConfirm(submission.value.password)
		}
	}

	return (
		<form
			id={form.id}
			onSubmit={handleSubmit}
			className={cn('space-y-4', className)}
		>
			<input type="hidden" name="userId" value={admin.id} />

			<div className="space-y-2">
				<Label htmlFor={fields.password.id}>Nouveau mot de passe</Label>
				<div className="relative">
					<Input
						id={fields.password.id}
						name={fields.password.name}
						type={showPassword ? 'text' : 'password'}
						placeholder="Entrez le nouveau mot de passe"
						required
						minLength={8}
						className="pr-10"
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						className="absolute right-2 top-1/2 -translate-y-1/2"
						onClick={() => setShowPassword(!showPassword)}
					>
						{showPassword ? (
							<RiEyeOffLine size={20} />
						) : (
							<RiEyeLine size={20} />
						)}
					</Button>
				</div>
				{fields.password.errors && (
					<p className="text-sm text-destructive">{fields.password.errors}</p>
				)}
			</div>

			<div className="hidden sm:flex justify-end gap-2 pt-4">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isLoading}
				>
					Annuler
				</Button>
				<ButtonLoading type="submit" loading={isLoading} variant="primary">
					Réinitialiser
				</ButtonLoading>
			</div>
		</form>
	)
}

export function ResetPasswordForm({
	admin,
	isLoading,
	onConfirm,
	onCancel,
}: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const title = 'Réinitialiser le mot de passe'

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onCancel}>
				<DialogContent
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
					showCloseButton={false}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>
							Définissez un nouveau mot de passe pour{' '}
							<strong>{admin.name}</strong>.
						</DialogDescription>
					</DialogHeader>

					<MainForm
						admin={admin}
						isLoading={isLoading}
						onConfirm={onConfirm}
						onCancel={onCancel}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onCancel}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
					<p className="text-sm text-muted-foreground">
						Définissez un nouveau mot de passe pour{' '}
						<strong>{admin.name}</strong>.
					</p>
				</DrawerHeader>

				<MainForm
					admin={admin}
					isLoading={isLoading}
					onConfirm={onConfirm}
					className="px-4"
				/>

				<DrawerFooter className="pt-2">
					<ButtonLoading
						type="submit"
						form="reset-password-form"
						loading={isLoading}
						variant="primary"
					>
						Réinitialiser
					</ButtonLoading>
					<DrawerClose asChild>
						<Button variant="outline" disabled={isLoading}>
							Annuler
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
