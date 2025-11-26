import { type ComponentProps, useCallback, useEffect, useState } from 'react'
import { useFetcher } from '@remix-run/react'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { toast } from 'sonner'
import { useMediaQuery } from 'usehooks-ts'

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
import { ButtonLoading } from '~/components/button-loading'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'
import FieldError from '~/components/form/field-error'
import InputField from '~/components/form/input-field'
import { MultipleSelector, type Option } from '~/components/form/multi-selector'
import PasswordInputField from '~/components/form/password-input-field'
import InputRadio from '~/components/form/radio-field'
import { SelectField } from '~/components/form/select-field'
import type { GetHonorFamilyAddableMembersLoaderData } from '~/routes/api/get-honor-family-addable-members/_index'
import { MOBILE_WIDTH } from '~/shared/constants'
import { cn } from '~/utils/ui'

import { FORM_INTENT } from '../../constants'
import { createHonorFamilySchema } from '../../schema'
import { type ActionData } from '../../server/action.server'
import { type HonorFamily } from '../../types'

interface Props {
	onClose: (shouldReloade: boolean) => void
	honorFamily?: HonorFamily
}

export function EditHonorFamilyForm({ onClose, honorFamily }: Readonly<Props>) {
	const fetcher = useFetcher<ActionData>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = honorFamily
		? "Modifcation de la famille d'honeur"
		: "Nouvelle famille d'honneur"

	const successMessage = honorFamily
		? 'Modification effectuée avec succès'
		: "Famille d'honneur créée avec succès"

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success(successMessage)
			onClose(true)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.state, fetcher.data, onClose])

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

interface MainFormProps extends ComponentProps<'form'> {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionData>>
	honorFamily?: HonorFamily
	onClose?: (shouldReloade: boolean) => void
}

function MainForm({
	className,
	isLoading,
	fetcher,
	honorFamily,
	onClose,
}: Readonly<MainFormProps>) {
	const { load, data: membersData } =
		useFetcher<GetHonorFamilyAddableMembersLoaderData>()

	const [memberOptions, setMemberOptions] = useState<Option[]>([])
	const [requestPassword, setRequestPassword] = useState(
		!honorFamily?.manager?.isAdmin,
	)

	const [showEmailField, setShowEmailField] = useState(
		!honorFamily?.manager?.email,
	)

	const formAction = honorFamily ? `./${honorFamily.id}` : '.'
	const schema = createHonorFamilySchema

	const getOptions = useCallback(
		(data: { id: string; name: string }[] | undefined) => {
			return (
				data?.map(member => ({ label: member.name, value: member.id })) || []
			)
		},
		[],
	)

	const [form, fields] = useForm({
		constraint: getZodConstraint(schema),
		id: 'edit-honor-family-form',
		lastResult: fetcher.data as SubmissionResult<string[]>,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		shouldRevalidate: 'onBlur',
		defaultValue: {
			name: honorFamily?.name,
			location: honorFamily?.location,
			selectionMode: 'manual',
			memberIds: JSON.stringify(
				getOptions(honorFamily?.members).map(option => option.value),
			),
		},
	})

	function handleMultiselectChange(options: Array<{ value: string }>) {
		form.update({ name: 'selectionMode', value: 'manual' })
		form.update({ name: 'membersFile', value: undefined })
		form.update({
			name: 'memberIds',
			value: JSON.stringify(options.map(option => option.value)),
		})
	}

	const handleFileChange = (file: any) => {
		form.update({ name: 'selectionMode', value: 'file' })
		form.update({ name: 'membersFile', value: file || undefined })
		form.update({ name: 'memberIds', value: undefined })
	}

	const handleSelectionModeChange = (value: string) => {
		form.update({ name: 'selectionMode', value })
		form.update({
			name: value === 'file' ? 'memberIds' : 'membersFile',
			value: undefined,
		})
	}

	const handleManagerChange = useCallback(
		(id: string) => {
			const selectedManager = membersData?.find(m => m.id === id)
			setRequestPassword(!selectedManager?.isAdmin)
			setShowEmailField(!selectedManager?.email)
		},
		[membersData],
	)

	useEffect(() => {
		const params = new URLSearchParams({ familyId: honorFamily?.id || '' })
		load(`/api/get-honor-family-addable-members?${params.toString()}`)
	}, [honorFamily?.id, load])

	useEffect(() => {
		if (membersData) {
			setMemberOptions(getOptions(membersData))
		}
	}, [membersData, getOptions])

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
						label="Responsable"
						placeholder="Selectionner un responsable"
						items={memberOptions}
						hintMessage="Le responsable est d'office membre de la famille"
						onChange={handleManagerChange}
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

				{requestPassword && (
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
						options={memberOptions}
						placeholder="Sélectionner un ou plusieurs fidèles"
						testId="tribe-multi-selector"
						className="py-3.5"
						onChange={handleMultiselectChange}
						defaultValue={getOptions(honorFamily?.members)}
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
				<ButtonLoading
					type="submit"
					value={honorFamily ? FORM_INTENT.EDIT : FORM_INTENT.CREATE}
					name="intent"
					variant="primary"
					disabled={isLoading}
					className="w-full sm:w-auto"
					loading={isLoading}
				>
					Enregister
				</ButtonLoading>
			</div>
		</fetcher.Form>
	)
}
