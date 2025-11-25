import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
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
import { editTribeSchema } from '../../schema'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { useCallback, useEffect, useState } from 'react'
import { MultipleSelector, type Option } from '~/components/form/multi-selector'
import InputRadio from '~/components/form/radio-field'
import { toast } from 'sonner'
import type { Tribe } from '../../types'
import PasswordInputField from '~/components/form/password-input-field'
import { FORM_INTENT } from '../../constants'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'
import FieldError from '~/components/form/field-error'
import { ScrollArea } from '~/components/ui/scroll-area'
import { type GetTribeAddableMembersLoaderData } from '~/routes/api/get-tribe-addable-members/_index'
import { ButtonLoading } from '~/components/button-loading'

import { type ActionType } from '../../server/action.server'

interface Props {
	tribe?: Tribe
	onClose: (reloadData: boolean) => void
}

export function EditTribeForm({ onClose, tribe }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	const isEdit = !!tribe
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)
	const title = isEdit ? 'Modification de la tribu' : 'Nouvelle tribu'
	const successMessage = isEdit
		? 'Tribu modifiée avec succès.'
		: 'Tribu créée avec succès.'

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success(successMessage)
			onClose(true)
		}
	}, [fetcher.state, fetcher.data, successMessage, onClose])

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
	const { load, data: membersData } =
		useFetcher<GetTribeAddableMembersLoaderData>()

	const [memberOptions, setMemberOptions] = useState<Option[]>([])
	const [requestPassword, setRequestPassword] = useState(
		!tribe?.manager?.isAdmin,
	)

	const [showEmailField, setShowEmailField] = useState(!tribe?.manager?.email)

	const editMode = !!tribe
	const formAction = editMode ? `./${tribe?.id}` : '.'

	const getOptions = useCallback(
		(data: { id: string; name: string }[] | undefined) => {
			return (
				data?.map(member => ({ label: member.name, value: member.id })) || []
			)
		},
		[],
	)

	const [form, fields] = useForm({
		id: 'edit-tribe-form',
		lastResult: fetcher.data as SubmissionResult<string[]>,
		constraint: getZodConstraint(editTribeSchema),
		shouldRevalidate: 'onBlur',
		defaultValue: {
			name: tribe?.name ?? '',
			tribeManagerEmail: tribe?.manager?.email ?? '',
			selectionMode: 'manual',
			memberIds: JSON.stringify(
				getOptions(tribe?.members).map(option => option.value),
			),
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: editTribeSchema })
		},
	})

	function handleMultiselectChange(options: Array<{ value: string }>) {
		form.update({ name: 'selectionMode', value: 'manual' })
		form.update({
			name: 'memberIds',
			value: JSON.stringify(options.map(option => option.value)),
		})
		form.update({ name: 'membersFile', value: undefined })
	}

	const handleFileChange = useCallback(
		(file: any) => {
			form.update({ name: 'selectionMode', value: 'file' })
			form.update({ name: 'membersFile', value: file || undefined })
			form.update({ name: 'memberIds', value: undefined })
		},
		[form],
	)

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

	const handleManagerChange = useCallback(
		(id: string) => {
			const selectedManager = membersData?.find(m => m.id === id)
			setRequestPassword(!selectedManager?.isAdmin)
			setShowEmailField(!selectedManager?.email)
		},
		[membersData],
	)

	useEffect(() => {
		const params = new URLSearchParams({ tribeId: tribe?.id || '' })
		load(`/api/get-tribe-addable-members?${params.toString()}`)
	}, [tribe?.id, load])

	useEffect(() => {
		if (membersData) {
			setMemberOptions(getOptions(membersData))
		}
	}, [membersData, getOptions])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			encType="multipart/form-data"
			className={cn('grid gap-4 mt-4 max-h-[calc(100vh-12rem)]', className)}
		>
			<ScrollArea className="overflow-y-auto pr-3">
				<div className="space-y-4">
					<div className="flex flex-wrap sm:flex-nowrap gap-4">
						<InputField field={fields.name} label="Nom" />
						<SelectField
							field={fields.tribeManagerId}
							label="Responsable"
							placeholder="Sélectionner un responsable"
							items={memberOptions}
							onChange={handleManagerChange}
							hintMessage="Le responsable est d'office membre de la tribu"
							defaultValue={tribe?.manager?.id}
						/>
					</div>

					{showEmailField && (
						<div className="flex flex-wrap sm:flex-nowrap">
							<InputField
								field={fields.tribeManagerEmail}
								label="Email"
								type="email"
							/>
						</div>
					)}

					{requestPassword && (
						<div className="flex flex-wrap sm:flex-nowrap">
							<PasswordInputField
								label="Mot de passe"
								field={fields.password}
								inputProps={{ autoComplete: 'new-password' }}
							/>
						</div>
					)}
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
							defaultValue={getOptions(tribe?.members)}
						/>
					) : (
						<ExcelFileUploadField
							name={fields.membersFile.name}
							onFileChange={handleFileChange}
						/>
					)}
					<FieldError className="text-xs" field={fields.memberIds} />
				</div>
			</ScrollArea>

			<div className="sm:flex sm:justify-end sm:space-x-4">
				{onClose && (
					<Button
						type="button"
						variant="outline"
						onClick={() => onClose(false)}
					>
						Fermer
					</Button>
				)}
				<ButtonLoading
					type="submit"
					value={editMode ? FORM_INTENT.UPDATE_TRIBE : FORM_INTENT.CREATE_TRIBE}
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
