import React, { useEffect, useState, useCallback } from 'react'
import { useFetcher } from '@remix-run/react'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import { createDepartmentSchema, updateDepartmentSchema } from '../schema'
import InputField from '~/components/form/input-field'
import PasswordInputField from '~/components/form/password-input-field'
import { SelectField } from '~/components/form/select-field'
import { MultipleSelector, type Option } from '~/components/form/multi-selector'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'
import InputRadio from '~/components/form/radio-field'
import FieldError from '~/components/form/field-error'
import type { Department } from '../model'
import type { GetAllMembersApiData } from '~/api/get-all-members/_index'
import { ScrollArea } from '~/components/ui/scroll-area'

interface MainFormProps extends React.ComponentProps<'form'> {
	isLoading: boolean
	department?: Department
	fetcher: ReturnType<typeof useFetcher<any>>
	onClose?: () => void
}

export default function MainForm({
	className,
	isLoading,
	department,
	fetcher,
	onClose,
}: Readonly<MainFormProps>) {
	const lastSubmission = fetcher.data
	const { load, data: membersData } = useFetcher<GetAllMembersApiData>()

	const [memberOptions, setMemberOptions] = useState<Option[]>([])
	const [requestPassword, setRequestPassword] = useState(
		!department?.manager?.isAdmin,
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
		id: 'department-form',
		constraint: getZodConstraint(schema),
		lastResult: lastSubmission,
		onValidate: ({ formData }) => parseWithZod(formData, { schema }),
		shouldRevalidate: 'onBlur',
		defaultValue: {
			name: department?.name ?? '',
			managerId: department?.manager?.id ?? '',
			selectionMode: 'manual',
			members: JSON.stringify(
				getOptions(department?.members).map(option => option.value),
			),
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
			const isAdmin = membersData?.find(m => m.id === id)?.isAdmin
			setRequestPassword(!isAdmin)
		},
		[membersData],
	)

	useEffect(() => {
		load(
			`/api/get-all-members?entitiesToExclude=departmentId;managedDepartment&managerIdToInclude=${department?.manager?.id}`,
		)
	}, [department?.manager?.id, load])

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
			className={cn('grid items-start gap-4 pt-4', className)}
			encType="multipart/form-data"
		>
			<ScrollArea className="flex-1 overflow-y-auto h-96 sm:h-[calc(100vh-15rem)] pr-4">
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

				{requestPassword && (
					<div className="flex flex-wrap sm:flex-nowrap gap-4">
						<PasswordInputField
							label="Mot de passe"
							field={fields.password}
							inputProps={{ autoComplete: 'new-password' }}
						/>
					</div>
				)}

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
							field={fields.members}
							options={memberOptions}
							placeholder="Sélectionner un ou plusieurs membres"
							onChange={handleMultiselectChange}
							className="py-3.5 mt-2"
							listPosition="top"
							defaultValue={getOptions(department?.members)}
						/>
					) : (
						<ExcelFileUploadField
							name={fields.membersFile.name}
							onFileChange={handleFileChange}
							className="mt-2"
						/>
					)}
					<FieldError className="text-xs" field={fields.members} />
				</div>
			</ScrollArea>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					name="intent"
					value={department ? 'update' : 'create'}
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
