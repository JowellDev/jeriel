import { type useFetcher } from '@remix-run/react'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import { archiveUserSchema } from '../schema'
import InputField from '~/components/form/input-field'
import type { ArchiveRequest } from '../model'
import { Card } from '../../../../components/ui/card'
import { UsersToArchiveTable } from './users-to-archive-table'
import { useEffect, useState } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'
import FieldError from '../../../../components/form/field-error'
import type { AuthorizedEntity } from '../../dashboard/types'
import { SelectInput } from '../../../../components/form/select-input'

interface MainFormProps extends React.ComponentProps<'form'> {
	isLoading: boolean
	archiveRequest: ArchiveRequest
	fetcher: ReturnType<typeof useFetcher<any>>
	onClose?: () => void
	authorizedEntities: AuthorizedEntity[]
	defaultEntity: AuthorizedEntity
	onFilter: (entity?: AuthorizedEntity) => void
}

export default function MainForm({
	className,
	isLoading,
	archiveRequest,
	fetcher,
	onClose,
	authorizedEntities,
	onFilter,
	defaultEntity,
}: MainFormProps) {
	const formAction = '.'
	const schema = archiveUserSchema

	const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
	const [selectedEntity, setSelectedEntity] = useState<
		AuthorizedEntity | undefined
	>(defaultEntity)

	const [form, fields] = useForm({
		id: 'archive-request-form',
		constraint: getZodConstraint(schema),
		lastResult: fetcher.data as SubmissionResult<string[]>,
		onValidate: ({ formData }) => parseWithZod(formData, { schema }),
		shouldRevalidate: 'onBlur',
	})

	function onFilterChange(value: string) {
		const entity = authorizedEntities.find(a => a.id === value)
		onFilter(entity)
		setSelectedEntity(entity)
	}

	useEffect(() => {
		const getSelectedRows = () => {
			return Object.keys(rowSelection)
				.filter(index => rowSelection[index])
				.map(index => archiveRequest.usersToArchive[parseInt(index, 10)])
				.map(user => user.id)
		}

		const data = getSelectedRows()

		form.update({ name: 'usersToArchive', value: data?.join(';') ?? '' })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rowSelection])

	useEffect(() => {
		form.update({ name: 'origin', value: selectedEntity?.name ?? '' })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedEntity])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4 pt-4', className)}
			encType="multipart/form-data"
		>
			<SelectInput
				items={authorizedEntities.map(({ name, id, type }) => ({
					label: name ?? '',
					value: id,
				}))}
				defaultValue={selectedEntity?.id}
				onChange={onFilterChange}
				placeholder=""
			/>

			<Card className="space-y-2 pb-4 mt-5 mb-2 max-h-[calc(50vh-10px)] overflow-y-auto">
				<UsersToArchiveTable
					data={archiveRequest.usersToArchive}
					rowSelection={rowSelection}
					setRowSelection={setRowSelection}
				/>
			</Card>

			<FieldError field={fields.usersToArchive} />

			<InputField field={fields.origin} inputProps={{ hidden: true }} />
			<InputField field={fields.usersToArchive} inputProps={{ hidden: true }} />

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					name="intent"
					value={'request'}
					variant={'primary'}
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Soumettre
				</Button>
			</div>
		</fetcher.Form>
	)
}
