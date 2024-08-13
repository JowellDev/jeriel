import * as React from 'react'
import { useMediaQuery } from 'usehooks-ts'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { cn } from '~/utils/ui'
import { useFetcher } from '@remix-run/react'
import type { ActionType } from '../action.server'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { createChurchSchema, updateChurchSchema } from '../schema'
import InputField from '~/components/form/input-field'
import PasswordInputField from '~/components/form/password-input-field'
import type { Church } from '../model'
import { MOBILE_WIDTH } from '../../../../components/layout/mobile/width'

interface Props {
	onClose: () => void
	church?: Church
}

export function ChurchesFormDialog({ onClose, church }: Props) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = church ? `Modifier l'église` : 'Nouvelle église'

	React.useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle' && !fetcher.data.error) {
			onClose()
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
						church={church}
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
					church={church}
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

function MainForm({
	className,
	isLoading,
	church,
	fetcher,
	onClose,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	church?: Church
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
}) {
	const lastSubmission = fetcher.data as any

	const formAction = church ? `./${church.id}` : '.'

	const schema = church ? updateChurchSchema : createChurchSchema

	const [form, fields] = useForm({
		constraint: getZodConstraint(schema),
		lastResult: lastSubmission,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		id: 'church-form',
		shouldRevalidate: 'onBlur',
		defaultValue: {
			churchName: church?.name,
			adminFullname: church?.user.fullname,
			adminPhone: church?.user.phone,
		},
	})

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4', className)}
			autoComplete="off"
		>
			<InputField field={fields.churchName} label="Nom de l'église" />
			<InputField
				field={fields.adminFullname}
				label="Nom et prénoms de l'administrateur"
			/>
			<InputField
				field={fields.adminPhone}
				label="Numéro de téléphone"
				InputProps={{ type: 'tel' }}
			/>
			<PasswordInputField
				label="Mot de passe"
				field={fields.password}
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
					value={church ? 'update' : 'create'}
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
