import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import { type useFetcher } from '@remix-run/react'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { createDepartmentSchema, updateDepartmentSchema } from '../schema'
import InputField from '~/components/form/input-field'
import PasswordInputField from '~/components/form/password-input-field'
import type { Department } from '../model'
import { SelectField } from '~/components/form/select-field'
import { MultipleSelector } from '~/components/form/multi-selector'
import { useApiData } from '~/hooks/api-data.hook'
import { useEffect, useState } from 'react'
import ExcelFileUploadField from '../../../../components/form/excel-file-upload-field'
import { Switch } from '../../../../components/ui/switch'
import { Label } from '../../../../components/ui/label'

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
}: MainFormProps) {
	const lastSubmission = fetcher.data
	const apiData = useApiData<{ members: Array<{ id: string; name: string }> }>(
		'/api/get-members',
	)
	const [memberOptions, setMemberOptions] = useState<
		Array<{ label: string; value: string }>
	>([])

	const [isManualMode, setIsManualMode] = useState(true)

	const formAction = department ? `./${department.id}` : '.'
	const schema = department ? updateDepartmentSchema : createDepartmentSchema

	const [form, fields] = useForm({
		id: 'department-form',
		constraint: getZodConstraint(schema),
		lastResult: lastSubmission,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		shouldRevalidate: 'onBlur',
		defaultValue: {
			name: department?.name ?? '',
			managerId: department?.manager.id ?? '',
			selectionMode: 'manual',
			members: department?.members.length
				? JSON.stringify(department.members)
				: '',
		},
	})

	function handleMultiselectChange(options: Array<{ value: string }>) {
		form.update({ name: 'selectionMode', value: 'manual' })

		form.update({
			name: 'members',
			value: JSON.stringify(options.map(option => option.value)),
		})
		form.update({ name: 'membersFile', value: undefined })

		console.log(form.value)
	}

	function handleFileChange(file: any) {
		form.update({ name: 'selectionMode', value: 'file' })
		form.update({ name: 'membersFile', value: file || undefined })
		form.update({ name: 'members', value: undefined })

		console.log(form.value, ' ok okok')
	}

	function handleSelectionModeChange(checked: boolean) {
		setIsManualMode(checked)
		form.update({
			name: 'selectionMode',
			value: checked ? 'manual' : 'file',
		})
		if (checked) {
			form.update({ name: 'membersFile', value: undefined })
		} else {
			form.update({ name: 'members', value: undefined })
		}

		console.log(form.errors)
	}

	useEffect(() => {
		if (!apiData.isLoading && apiData.data) {
			setMemberOptions(
				apiData.data.members.map(member => ({
					label: member.name,
					value: member.id,
				})),
			)
		}
	}, [apiData.data, apiData.isLoading])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4 pt-4', className)}
			encType="multipart/form-data"
		>
			<div className="flex flex-wrap sm:flex-nowrap gap-4">
				<InputField field={fields.name} label="Nom" />
				<SelectField
					field={fields.managerId}
					label="Responsable"
					placeholder="Sélectionner le responsable"
					items={memberOptions}
				/>
			</div>

			<div className="flex flex-wrap sm:flex-nowrap gap-4">
				<PasswordInputField
					label="Mot de passe"
					field={fields.password}
					InputProps={{ autoComplete: 'new-password' }}
				/>
				<PasswordInputField
					label="Confirmer le mot de passe"
					field={fields.passwordConfirm}
				/>
			</div>

			<div className="mt-4">
				<div className="flex items-center gap-4">
					<Label>Membres</Label>
					<div className="flex items-center gap-4">
						<Switch
							checked={isManualMode}
							onCheckedChange={handleSelectionModeChange}
						/>
						<span className="text-xs">
							{isManualMode ? 'Sélection manuelle' : 'Import par fichier'}
						</span>
					</div>
				</div>
				{isManualMode ? (
					<MultipleSelector
						field={fields.members}
						options={memberOptions}
						placeholder="Sélectionner un ou plusieurs membres"
						onChange={handleMultiselectChange}
						className="mt-2"
					/>
				) : (
					<ExcelFileUploadField
						name={fields.membersFile.name}
						onFileChange={handleFileChange}
						className="mt-2"
					/>
				)}
			</div>

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
				>
					Enregistrer
				</Button>
			</div>
		</fetcher.Form>
	)
}
