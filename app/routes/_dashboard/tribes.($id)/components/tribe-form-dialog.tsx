import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useFetcher } from '@remix-run/react'
import { useMediaQuery } from 'usehooks-ts'
import InputField from '~/components/form/input-field'
import { SelectField } from '~/components/form/select-field'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '~/components/ui/drawer'
import { MOBILE_WIDTH } from '~/shared/constants'
import { cn } from '~/utils/ui'
import { createTribeSchema } from '../schema'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'

import { useCallback, useEffect, useState } from 'react'
import { MultipleSelector, type Option } from '~/components/form/multi-selector'
import { type ActionType } from '../action.server'
import InputRadio from '~/components/form/radio-field'
import { stringify, transformApiData } from '../utils'
import { toast } from 'sonner'
import type { ApiFormData, Tribe } from '../types'
import PasswordInputField from '~/components/form/password-input-field'
import { FORM_INTENT } from '../constants'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'
import FieldError from '~/components/form/field-error'

interface Props {
	onClose: (reloadData: boolean) => void
	tribe?: Tribe
}

export function TribeFormDialog({ onClose, tribe }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = tribe ? `Modification de la tribu` : 'Nouvelle tribu'

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success) {
			const message = fetcher.data.message
			message && toast.success(message)
			onClose(true)
		}
	}, [fetcher.state, fetcher.data, onClose])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl"
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
						tribe={tribe}
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
					tribe={tribe}
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
	onClose,
	tribe,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: (reloadData: boolean) => void
	tribe?: Tribe
}) {
	const editMode = !!tribe

	const formAction = tribe ? `./${tribe?.id}` : '.'
	const schema = createTribeSchema

	const { load, data } = useFetcher<ApiFormData>()

	const [showPasswordField, setShowPasswordField] = useState(
		!tribe?.manager.isAdmin,
	)
	const [selectedMembers, setSelectedMembers] = useState<Option[] | undefined>(
		!tribe?.members ? undefined : transformApiData(tribe.members),
	)

	const allMembers = data?.members.concat(
		!tribe?.members ? [] : transformApiData(tribe.members),
	)

	const allAdmins = data?.admins.concat(
		!tribe?.manager
			? []
			: [
					{
						label: tribe.manager.name,
						value: tribe.manager.id,
						isAdmin: tribe.manager.isAdmin,
					},
				],
	)

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

	const [form, fields] = useForm({
		lastResult: fetcher.data?.lastResult,
		id: 'edit-tribe-form',
		constraint: getZodConstraint(schema),
		shouldRevalidate: 'onBlur',
		defaultValue: { name: tribe?.name, selectionMode: 'manual' },
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
	})

	const handleFileChange = useCallback(
		(file: any) => {
			form.update({ name: 'selectionMode', value: 'file' })
			form.update({ name: 'membersFile', value: file || undefined })
			form.update({ name: 'memberIds', value: undefined })
		},
		[form],
	)
	function handleManagerChange(id: string) {
		const selectedManager = allAdmins?.find(admin => admin.value === id)
		setShowPasswordField(selectedManager ? !selectedManager.isAdmin : true)
	}

	useEffect(() => {
		load('/api/get-members')
		handleMultiselectChange(selectedMembers ?? [])
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

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

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			encType="multipart/form-data"
			className={cn('grid items-start gap-4 mt-4', className)}
		>
			<div className="flex flex-wrap sm:flex-nowrap gap-4">
				<InputField field={fields.name} label="Nom" />
				<SelectField
					field={fields.tribeManagerId}
					label="Responsable"
					placeholder="Sélectionner un responsable"
					items={allAdmins ?? []}
					onChange={handleManagerChange}
					hintMessage="Le responsable est d'office membre du département"
					defaultValue={tribe?.manager.id}
				/>
			</div>
			{showPasswordField && (
				<div className="flex flex-wrap sm:flex-nowrap gap-4">
					<PasswordInputField
						label="Mot de passe"
						field={fields.password}
						InputProps={{ autoComplete: 'new-password' }}
					/>
				</div>
			)}
			<div className="mt-4">
				<InputField
					field={fields.selectionMode}
					InputProps={{ hidden: true }}
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
						options={allMembers}
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
						type="button"
						variant="outline"
						onClick={() => onClose(false)}
					>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value={editMode ? FORM_INTENT.UPDATE_TRIBE : FORM_INTENT.CREATE_TRIBE}
					name="intent"
					variant="primary"
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Enregistrer
				</Button>
			</div>
		</fetcher.Form>
	)
}
