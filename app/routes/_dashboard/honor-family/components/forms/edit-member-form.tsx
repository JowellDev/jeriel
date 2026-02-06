import { useEffect } from 'react'
import { useFetcher } from '@remix-run/react'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { toast } from 'sonner'
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
import { ButtonLoading } from '~/components/button-loading'
import InputField from '~/components/form/input-field'
import { SelectField } from '~/components/form/select-field'
import { MaritalStatuSelectOptions, MOBILE_WIDTH } from '~/shared/constants'
import { createEntityMemberSchema } from '~/shared/schema'
import { cn } from '~/utils/ui'

import { FORM_INTENT } from '../../constants'
import { type ActionType } from '../../server/action.server'

interface Props {
	onClose: () => void
}

export function EditMemberForm({ onClose }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Nouveau fidèle'

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
						<DialogDescription></DialogDescription>
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

interface MainFormProps extends React.ComponentProps<'form'> {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
}

function MainForm({
	className,
	isLoading,
	fetcher,
	onClose,
}: Readonly<MainFormProps>) {
	const formAction = `/honor-family`

	const [form, fields] = useForm({
		id: 'create-honor-family-member-form',
		constraint: getZodConstraint(createEntityMemberSchema),
		lastResult: fetcher.data as SubmissionResult<string[]>,
		shouldRevalidate: 'onBlur',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: createEntityMemberSchema })
		},
	})

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success('Ajout effectuée avec succès.')
			onClose?.()
		}
	}, [fetcher.state, fetcher.data, onClose])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4', className)}
		>
			<div className="grid sm:grid-cols-2 gap-4">
				<InputField field={fields.name} label="Nom et prénoms" />
				<InputField field={fields.location} label="Localisation" />
				<InputField field={fields.email} label="Adresse email" />
				<InputField field={fields.phone} label="Numéro de téléphone" />
				<InputField
					field={fields.birthday}
					label="Date de naissance"
					type="date"
					inputProps={{ max: new Date().toISOString().split('T')[0] }}
				/>
				<SelectField
					field={fields.gender}
					label="Genre"
					placeholder="Sélectionner un genre"
					items={[
						{ value: 'M', label: 'Homme' },
						{ value: 'F', label: 'Femme' },
					]}
				/>
				<div className="col-span-2">
					<SelectField
						field={fields.maritalStatus}
						label="Statut matrimonial"
						placeholder="Sélectionner un statut"
						items={MaritalStatuSelectOptions}
					/>
				</div>

				<div className="col-span-2">
					<InputField
						field={fields.picture}
						label="Photo"
						type="file"
						inputProps={{ accept: '.png, .jpg, .jpeg' }}
					/>
				</div>
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<ButtonLoading
					type="submit"
					value={FORM_INTENT.CREATE}
					name="intent"
					variant="primary"
					loading={isLoading}
					className="w-full sm:w-auto"
				>
					Enregistrer
				</ButtonLoading>
			</div>
		</fetcher.Form>
	)
}
