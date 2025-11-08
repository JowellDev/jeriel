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
import {
	type ComponentProps,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { Button } from '~/components/ui/button'
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
import { formatAsSelectFieldsData, stringify } from '../utils'
import LoadingButton from '~/components/loading-button'
import { toast } from 'sonner'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'
import FieldError from '~/components/form/field-error'
import InputRadio from '~/components/form/radio-field'
interface Props {
	onClose: (shouldReloade: boolean) => void
	honorFamily?: HonorFamily
}

export function HonoreFamilyFormDialog({
	onClose,
	honorFamily,
}: Readonly<Props>) {
	const fetcher = useFetcher<ActionData>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = honorFamily
		? "Modifcation de la famille d'honeur"
		: 'Nouvelle famille d’honneur'

	useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle' && fetcher.data.success) {
			const message = fetcher.data.message
			if (message) toast.success(message)
			onClose(true)
		}
	}, [fetcher.data, fetcher.state, onClose])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={() => onClose(false)}>
				<DialogContent
					className="md:max-w-3xl overflow-y-auto max-h-[calc(100vh-10px)]"
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
						honorFamily={honorFamily}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={() => onClose(false)}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
				</DrawerHeader>
				<MainForm
					isLoading={isSubmitting}
					fetcher={fetcher}
					honorFamily={honorFamily}
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
	fetcher,
	honorFamily,
	onClose,
}: ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionData>>
	honorFamily?: HonorFamily
	onClose?: (shouldReloade: boolean) => void
}) {
	const { load, data } = useFetcher<LoadingApiFormData>()

	const [showPasswordField, setShowPasswordField] = useState(
		!honorFamily?.manager?.isAdmin,
	)
	const [showEmailField, setShowEmailField] = useState(
		!honorFamily?.manager?.email,
	)
	const [selectedMembers, setSelectedMembers] = useState<Option[] | undefined>(
		!honorFamily?.members
			? undefined
			: formatAsSelectFieldsData(honorFamily.members),
	)
	const [selectedManager, setSelectedManager] = useState<Option | undefined>(
		!honorFamily?.manager
			? undefined
			: {
					label: honorFamily.manager.name,
					value: honorFamily.manager.id,
					isAdmin: honorFamily.manager.isAdmin,
				},
	)

	const members = data?.members.concat(
		!honorFamily?.members ? [] : formatAsSelectFieldsData(honorFamily.members),
	)

	const admins = useMemo(
		() =>
			data?.admins.concat(
				!honorFamily?.manager
					? []
					: [
							{
								label: honorFamily.manager.name,
								value: honorFamily.manager.id,
								isAdmin: honorFamily.manager.isAdmin,
							},
						],
			),
		[data?.admins, honorFamily?.manager],
	)

	const formAction = honorFamily ? `./${honorFamily.id}` : '.'
	const schema = createHonorFamilySchema

	const [form, fields] = useForm({
		constraint: getZodConstraint(schema),
		id: 'edit-honor-family-form',
		lastResult: fetcher.data?.lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		shouldRevalidate: 'onBlur',
		defaultValue: {
			name: honorFamily?.name,
			location: honorFamily?.location,
			selectionMode: 'manual',
		},
	})

	function handleMultiselectChange(options: Option[]) {
		setSelectedMembers(options)
		form.update({ name: 'selectionMode', value: 'manual' })

		form.update({
			name: fields.memberIds.name,
			value: stringify(
				options.length === 0 ? '' : options.map(option => option.value),
			),
		})
	}

	const handleFileChange = useCallback(
		(file: any) => {
			form.update({ name: 'selectionMode', value: 'file' })
			form.update({ name: 'membersFile', value: file || undefined })
			form.update({ name: 'memberIds', value: undefined })
		},
		[form],
	)

	function handleManagerChange(id: string) {
		const selectedManager = admins?.find(admin => admin.value === id)
		setSelectedManager(selectedManager)
		setShowPasswordField(selectedManager ? !selectedManager?.isAdmin : true)
		setShowEmailField(selectedManager ? !selectedManager?.email : true)
	}

	const handleSelectionModeChange = useCallback(
		(value: string) => {
			form.update({ name: 'selectionMode', value })
			form.update({
				name: value === 'file' ? 'memberIds' : 'membersFile',
				value: undefined,
			})
		},
		[form],
	)

	useEffect(() => {
		load('/api/get-creating-honor-family-form-data')
		handleMultiselectChange(selectedMembers ?? [])
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<fetcher.Form
			method="post"
			action={formAction}
			encType="multipart/form-data"
			className={cn('grid items-start gap-4 mt-4', className)}
			{...getFormProps(form)}
		>
			<div className="grid sm:grid-cols-2 gap-4">
				<InputField field={fields.name} label="Nom de la famille d'honneur" />
				<InputField field={fields.location} label="Localisation" />

				<div className="col-span-2">
					<SelectField
						field={fields.managerId}
						value={selectedManager?.value}
						label="Responsable"
						placeholder="Selectionner un responsable"
						items={admins ?? []}
						onChange={handleManagerChange}
						hintMessage="Le responsable est d'office membre de la famille"
					/>
				</div>

				{showEmailField && (
					<div className="col-span-2">
						<InputField
							field={fields.managerEmail}
							label="Email"
							type="email"
						/>
					</div>
				)}

				{showPasswordField && (
					<div className="col-span-2">
						<PasswordInputField
							label="Mot de passe"
							field={fields.password}
							inputProps={{ autoComplete: 'new-password' }}
						/>
					</div>
				)}
			</div>

			<div className="mt-4">
				<InputField
					field={fields.selectionMode}
					inputProps={{ hidden: true }}
				/>
				<div className="mb-5">
					<InputRadio
						label="Membres"
						onValueChange={handleSelectionModeChange}
						field={fields.selectionMode}
						options={[
							{ label: 'Sélection manuelle', value: 'manual' },
							{ label: 'Import par fichier', value: 'file' },
						]}
						inline
					/>
				</div>
				{fields.selectionMode.value === 'manual' ? (
					<MultipleSelector
						label="Membres"
						field={fields.memberIds}
						options={members}
						placeholder="Sélectionner un ou plusieurs fidèles"
						testId="tribe-multi-selector"
						className="py-3.5"
						onChange={handleMultiselectChange}
						value={selectedMembers}
					/>
				) : (
					<ExcelFileUploadField
						name={fields.membersFile.name}
						onFileChange={handleFileChange}
						className="mt-2"
					/>
				)}
				<FieldError className="text-xs" field={fields.memberIds} />
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button
						disabled={isLoading}
						type="button"
						variant="outline"
						onClick={() => onClose(false)}
					>
						Fermer
					</Button>
				)}
				<LoadingButton
					loading={isLoading}
					loadingPosition="right"
					type="submit"
					value={honorFamily ? FORM_INTENT.EDIT : FORM_INTENT.CREATE}
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
