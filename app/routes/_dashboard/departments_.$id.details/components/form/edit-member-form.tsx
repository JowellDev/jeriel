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
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import InputField from '~/components/form/input-field'
import { MaritalStatuSelectOptions, MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { FORM_INTENT } from '../../constants'
import { type ActionType } from '../../server/action.server'
import { SelectField } from '~/components/form/select-field'
import { toast } from 'sonner'
import { createEntityMemberSchema } from '~/shared/schema'
import { useEffect } from 'react'
import { ButtonLoading } from '~/components/button-loading'

interface Props {
	onClose: () => void
	departmentId: string
}

export function EditMemberForm({ onClose, departmentId }: Readonly<Props>) {
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
					</DialogHeader>
					<MainForm
						isLoading={isSubmitting}
						fetcher={fetcher}
						onClose={onClose}
						showCloseBtn
						departmentId={departmentId}
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
					fetcher={fetcher}
					className="px-4"
					departmentId={departmentId}
					onClose={onClose}
					showCloseBtn={false}
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
	fetcher,
	onClose,
	departmentId,
	showCloseBtn,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose: () => void
	showCloseBtn: boolean
	departmentId: string
}) {
	const formAction = `/departments/${departmentId}/details`

	const [form, fields] = useForm({
		constraint: getZodConstraint(createEntityMemberSchema),
		lastResult: fetcher.data as SubmissionResult<string[]>,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: createEntityMemberSchema })
		},
		id: 'create-member-form',
		shouldRevalidate: 'onBlur',
	})

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success('Création effectuée avec succès.')
			onClose()
		}
	}, [fetcher.state, fetcher.data, onClose])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4', className)}
			encType="multipart/form-data"
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
				{showCloseBtn && onClose && (
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
					Enregister
				</ButtonLoading>
			</div>
		</fetcher.Form>
	)
}
