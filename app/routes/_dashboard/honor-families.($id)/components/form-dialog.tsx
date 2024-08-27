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
import { type ComponentProps, useEffect } from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { Button } from '@/components/ui/button'
import { cn } from '~/utils/ui'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { createHonorFamilySchema } from '../schema'
import InputField from '~/components/form/input-field'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { SelectField } from '~/components/form/select-field'
import { FORM_INTENT } from '../constants'
import { type ActionData } from '../action.server'
import PasswordInputField from '~/components/form/password-input-field'
import { type HonorFamily, type LoadingApiFormData } from '../types'
import { MultipleSelector, type Option } from '~/components/form/multi-selector'
import { stringify } from '../utils'
import LoadingButton from '~/components/form/loading-button'
import { toast } from 'sonner'

interface Props {
	onClose: () => void
	honorFamily?: HonorFamily
}

export function HonoreFamilyFormDialog({ onClose }: Props) {
	const fetcher = useFetcher<ActionData>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Nouvelle famille d’honneur'

	useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle' && fetcher.data.success) {
			onClose()
			toast.success('Création effectuée avec succès!')
		}
	}, [fetcher.data, fetcher.state, onClose])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl overflow-y-auto max-h-screen"
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
}: ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionData>>
	onClose?: () => void
}) {
	const { load, data } = useFetcher<LoadingApiFormData>()
	const formAction = '.'
	const schema = createHonorFamilySchema

	const [form, fields] = useForm({
		constraint: getZodConstraint(schema),
		lastResult: fetcher.data?.lastResult,
		onValidate({ formData }) {
			const data = parseWithZod(formData, { schema })
			console.log(data)
			return data
		},
		id: 'edit-member-form',
		shouldRevalidate: 'onBlur',
		defaultValue: {},
	})

	function handleMultiselectChange(options: Option[]) {
		form.update({
			name: 'members',
			value: stringify(
				options.length === 0 ? '' : options.map(option => option.value),
			),
		})
	}

	useEffect(() => {
		load('/api/get-creating-honor-family-form-data')
	}, [])

	return (
		<fetcher.Form
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4', className)}
			{...getFormProps(form)}
		>
			<div className="grid sm:grid-cols-2 gap-1">
				<InputField field={fields.name} label="Nom de la famille d’honneur" />
				<InputField field={fields.location} label="Localisation" />
				<SelectField
					field={fields.adminId}
					label="Responsable"
					placeholder="Selectionner un responsable"
					items={data?.admins ?? []}
				/>
				<PasswordInputField
					label="Mot de passe"
					field={fields.password}
					InputProps={{ className: 'bg-white' }}
				/>
			</div>
			<MultipleSelector
				label="Membres"
				options={data?.users}
				onChange={handleMultiselectChange}
				className="py-3.5 "
				placeholder="Sélectionner un ou plusieurs fidèles"
				field={fields.members}
			/>
			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button
						disabled={isLoading}
						type="button"
						variant="outline"
						onClick={onClose}
					>
						Fermer
					</Button>
				)}
				<LoadingButton
					loading={isLoading}
					loadingPosition="right"
					type="submit"
					value={FORM_INTENT.CREATE}
					name="intent"
					variant="primary"
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Enregister
				</LoadingButton>
			</div>
		</fetcher.Form>
	)
}
