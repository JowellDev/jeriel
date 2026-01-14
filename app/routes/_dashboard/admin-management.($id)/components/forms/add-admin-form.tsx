import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useMediaQuery } from 'usehooks-ts'

import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useFetcher } from '@remix-run/react'

import { ButtonLoading } from '~/components/button-loading'
import InputField from '~/components/form/input-field'
import PasswordInputField from '~/components/form/password-input-field'
import { SelectField } from '~/components/form/select-field'
import { Button } from '~/components/ui/button'
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
import { ScrollArea } from '~/components/ui/scroll-area'
import { type GetAddableAdminsLoaderData } from '~/routes/api/get-addable-admins/_index'
import { MOBILE_WIDTH } from '~/shared/constants'
import { cn } from '~/utils/ui'

import { FORM_INTENT } from '../../constants'
import { addAdminSchema } from '../../schema'
import { type ActionType } from '../../server/action.server'
import { Alert, AlertDescription } from '~/components/ui/alert'

interface Props {
	onClose: () => void
}

interface MainFormProps extends React.ComponentProps<'form'> {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
}

export function AddAdminForm({ onClose }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)
	const title = 'Ajouter un administrateur'
	const successMessage = 'Administrateur ajouté avec succès.'

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success(successMessage)
			onClose?.()
		}
	}, [fetcher.state, fetcher.data, onClose])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-2xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
					showCloseButton={false}
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
}: Readonly<MainFormProps>) {
	const { load, data: membersData } = useFetcher<GetAddableAdminsLoaderData>()

	const [memberOptions, setMemberOptions] = useState<
		{ label: string; value: string }[]
	>([])
	const [requestPassword, setRequestPassword] = useState(false)
	const [requestEmail, setRequestEmail] = useState(false)

	const [form, fields] = useForm({
		id: 'add-admin-form',
		lastResult: fetcher.data as SubmissionResult<string[]>,
		constraint: getZodConstraint(addAdminSchema),
		shouldRevalidate: 'onBlur',
		defaultValue: {
			userId: '',
			email: '',
			password: '',
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: addAdminSchema })
		},
	})

	const getOptions = useCallback(
		(data: GetAddableAdminsLoaderData | undefined) => {
			return (
				data?.map(member => ({ label: member.name, value: member.id })) || []
			)
		},
		[],
	)

	const handleMemberChange = useCallback(
		(id: string) => {
			const selectedMember = membersData?.find(m => m.id === id)
			const hasEmail = !!selectedMember?.email
			setRequestEmail(!hasEmail)
			const hasPassword = !!selectedMember?.password?.hash
			setRequestPassword(!hasPassword)
		},
		[membersData],
	)

	useEffect(() => {
		load('/api/get-addable-admins')
	}, [load])

	useEffect(() => {
		if (membersData) {
			setMemberOptions(getOptions(membersData))
		}
	}, [membersData, getOptions])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action="."
			className={cn('grid gap-4 mt-4 max-h-[calc(100vh-12rem)]', className)}
		>
			<ScrollArea className="overflow-y-auto pr-3">
				<div className="space-y-4">
					{form.errors && form.errors.length > 0 && (
						<Alert variant="destructive">
							<AlertDescription>{form.errors[0]}</AlertDescription>
						</Alert>
					)}

					<SelectField
						field={fields.userId}
						label="Sélectionner un fidèle"
						placeholder="Choisir un fidèle"
						items={memberOptions}
						onChange={handleMemberChange}
						hintMessage="Seuls les fidèles actifs qui ne sont pas déjà administrateurs sont affichés"
					/>

					{requestEmail && (
						<div className="space-y-2">
							<InputField
								label="Adresse email"
								field={fields.email}
								type="email"
								inputProps={{
									placeholder: 'Entrer une adresse email pour ce fidèle',
								}}
							/>
							<p className="text-xs text-muted-foreground">
								Ce fidèle n'a pas d'adresse email. Veuillez en ajouter une pour
								qu'il puisse se connecter.
							</p>
						</div>
					)}

					{requestPassword && (
						<div className="space-y-2">
							<PasswordInputField
								label="Mot de passe"
								field={fields.password}
								inputProps={{
									placeholder: 'Entrer un mot de passe pour ce fidèle',
								}}
							/>
							<p className="text-xs text-muted-foreground">
								Ce fidèle n'a pas encore de mot de passe. Veuillez en définir
								un.
							</p>
						</div>
					)}

					{!requestPassword && !requestEmail && fields.userId.value && (
						<Alert>
							<AlertDescription>
								Ce fidèle a déjà une adresse email et un mot de passe. Il pourra
								se connecter avec ses identifiants actuels.
							</AlertDescription>
						</Alert>
					)}
				</div>
			</ScrollArea>

			<div className="flex justify-end gap-2 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Annuler
					</Button>
				)}
				<ButtonLoading
					type="submit"
					value={FORM_INTENT.ADD_ADMIN}
					name="intent"
					variant="primary"
					loading={isLoading}
					disabled={!fields.userId.value}
				>
					Ajouter
				</ButtonLoading>
			</div>
		</fetcher.Form>
	)
}
