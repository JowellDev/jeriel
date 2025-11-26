import React, { useEffect, useState, useCallback } from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { toast } from 'sonner'
import { useFetcher } from '@remix-run/react'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import InputField from '~/components/form/input-field'
import PasswordInputField from '~/components/form/password-input-field'
import { SelectField } from '~/components/form/select-field'
import { MultipleSelector, type Option } from '~/components/form/multi-selector'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'
import InputRadio from '~/components/form/radio-field'
import FieldError from '~/components/form/field-error'
import { ScrollArea } from '~/components/ui/scroll-area'
import type { GetDepartmentAddableMembersLoaderData } from '~/routes/api/get-department-addable-members/_index'
import { ButtonLoading } from '~/components/button-loading'
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
import { cn } from '~/utils/ui'
import { MOBILE_WIDTH } from '~/shared/constants'
import { Button } from '~/components/ui/button'
import type { ActionType } from '../../server/actions/action.server'
import type { Department } from '../../model'
import { createDepartmentSchema, updateDepartmentSchema } from '../../schema'

interface MainFormProps extends React.ComponentProps<'form'> {
	isLoading: boolean
	department?: Department
	fetcher: ReturnType<typeof useFetcher<any>>
	onClose?: () => void
}

interface Props {
	onClose: () => void
	department?: Department
}

export function EditDepartmentForm({ onClose, department }: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const isEdit = !!department
	const title = isEdit ? 'Modification du département' : 'Nouveau département'
	const successMessage = isEdit
		? 'Département modifié avec succès.'
		: 'Département créé avec succès.'

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success(successMessage)
			onClose()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.state, fetcher.data, onClose])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
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
						department={department}
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
					department={department}
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
	department,
	fetcher,
	onClose,
}: Readonly<MainFormProps>) {
	const { load, data: membersData } =
		useFetcher<GetDepartmentAddableMembersLoaderData>()

	const [memberOptions, setMemberOptions] = useState<Option[]>([])
	const [requestPassword, setRequestPassword] = useState(
		!department?.manager?.isAdmin,
	)

	const [showEmailField, setShowEmailField] = useState(
		!department?.manager?.email,
	)

	const formAction = department ? `./${department.id}` : '.'
	const schema = department ? updateDepartmentSchema : createDepartmentSchema

	const getOptions = useCallback(
		(data: { id: string; name: string }[] | undefined) => {
			return (
				data?.map(member => ({ label: member.name, value: member.id })) || []
			)
		},
		[],
	)

	const [form, fields] = useForm({
		id: 'edit-department-form',
		lastResult: fetcher.data as SubmissionResult<string[]>,
		constraint: getZodConstraint(schema),
		shouldRevalidate: 'onBlur',
		defaultValue: {
			name: department?.name ?? '',
			managerId: department?.manager?.id ?? '',
			selectionMode: 'manual',
			members: JSON.stringify(
				getOptions(department?.members).map(option => option.value),
			),
		},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
	})

	function handleMultiselectChange(options: Array<{ value: string }>) {
		form.update({ name: 'selectionMode', value: 'manual' })
		form.update({
			name: 'members',
			value: JSON.stringify(options.map(option => option.value)),
		})
		form.update({ name: 'membersFile', value: undefined })
	}

	const handleFileChange = (file: any) => {
		form.update({ name: 'selectionMode', value: 'file' })
		form.update({ name: 'membersFile', value: file || undefined })
		form.update({ name: 'members', value: undefined })
	}

	const handleSelectionModeChange = (value: string) => {
		form.update({ name: 'selectionMode', value })
		form.update({
			name: value === 'file' ? 'members' : 'membersFile',
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
		const params = new URLSearchParams({ departmentId: department?.id || '' })
		load(`/api/get-department-addable-members?${params.toString()}`)
	}, [department?.id, load])

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
							field={fields.managerId}
							label="Responsable"
							placeholder="Sélectionner le responsable"
							items={memberOptions}
							hintMessage="Le responsable est d'office membre du département"
							onChange={handleManagerChange}
						/>
					</div>

					{showEmailField && (
						<div className="flex flex-wrap sm:flex-nowrap gap-4">
							<InputField
								field={fields.managerEmail}
								label="Email"
								type="email"
							/>
						</div>
					)}

					{requestPassword && (
						<div className="flex flex-wrap sm:flex-nowrap gap-4">
							<PasswordInputField
								label="Mot de passe"
								field={fields.password}
								inputProps={{ autoComplete: 'new-password' }}
							/>
						</div>
					)}
				</div>
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
						field={fields.members}
						options={memberOptions}
						placeholder="Sélectionner un ou plusieurs membres"
						onChange={handleMultiselectChange}
						className="py-3.5"
						defaultValue={getOptions(department?.members)}
					/>
				) : (
					<ExcelFileUploadField
						name={fields.membersFile.name}
						onFileChange={handleFileChange}
					/>
				)}
				<FieldError className="text-xs" field={fields.members} />
			</ScrollArea>

			<div className="sm:flex sm:justify-end sm:space-x-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<ButtonLoading
					type="submit"
					name="intent"
					value={department ? 'update' : 'create'}
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
