import { useMediaQuery } from 'usehooks-ts'
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
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import InputField from '~/components/form/input-field'
import { MOBILE_WIDTH, MaritalStatuSelectOptions } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { FORM_INTENT } from '../../constants'
import { type ActionType } from '../../server/action.server'
import { useEffect } from 'react'
import { SelectField } from '~/components/form/select-field'
import { toast } from 'sonner'
import { createEntityMemberSchema } from '~/shared/schema'

interface Props {
	onClose: () => void
	honorFamilyId: string
}

export function EditMemberForm({ onClose, honorFamilyId }: Readonly<Props>) {
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
						honorFamilyId={honorFamilyId}
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
					honorFamilyId={honorFamilyId}
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
	honorFamilyId,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
	honorFamilyId: string
}) {
	const formAction = `/honor-families/${honorFamilyId}/details`

	const [form, fields] = useForm({
		id: 'create-member-form',
		lastResult: fetcher.data as SubmissionResult<string[]>,
		constraint: getZodConstraint(createEntityMemberSchema),
		shouldRevalidate: 'onBlur',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: createEntityMemberSchema })
		},
	})

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success('Création effectuée avec succès.')
			onClose?.()
		}
	}, [fetcher.data, fetcher.state, onClose])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4', className)}
			encType="multipart/form-data"
		>
			<div className="grid sm:grid-cols-2 gap-3 pb-2 sm:px-2">
				<InputField field={fields.name} label="Nom et prénoms" />
				<InputField field={fields.location} label="Localisation" />
				<InputField field={fields.email} label="Adresse email" />
				<InputField field={fields.phone} label="Numéro de téléphone" />
				<InputField
					field={fields.birthday}
					label="Date de naissance"
					type="date"
				/>
				<div className="sm:col-span-2">
					<SelectField
						field={fields.gender}
						label="Genre"
						placeholder="Sélectionner un genre"
						items={[
							{ value: 'M', label: 'Homme' },
							{ value: 'F', label: 'Femme' },
						]}
					/>
				</div>
				<div className="sm:col-span-2">
					<SelectField
						field={fields.maritalStatus}
						label="Statut matrimonial"
						placeholder="Sélectionner un statut"
						items={MaritalStatuSelectOptions}
					/>
				</div>
				<div className="sm:col-span-2">
					<InputField field={fields.picture} label="Photo" type="file" />
				</div>
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value={FORM_INTENT.CREATE}
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
