import { type useFetcher } from '@remix-run/react'
import { getFormProps, useForm } from '@conform-to/react'
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

interface MainFormProps extends React.ComponentProps<'form'> {
	isLoading: boolean
	archiveRequest: ArchiveRequest
	fetcher: ReturnType<typeof useFetcher<any>>
	onClose?: () => void
}

export default function MainForm({
	className,
	isLoading,
	archiveRequest,
	fetcher,
	onClose,
}: MainFormProps) {
	const lastSubmission = fetcher.data

	const formAction = '.'
	const schema = archiveUserSchema

	const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

	const [form, fields] = useForm({
		id: 'archive-request-form',
		constraint: getZodConstraint(schema),
		lastResult: lastSubmission,
		onValidate: ({ formData }) => parseWithZod(formData, { schema }),
		shouldRevalidate: 'onBlur',
	})

	useEffect(() => {
		const getSelectedRows = () => {
			return Object.keys(rowSelection)
				.filter(index => rowSelection[index])
				.map(index => archiveRequest.usersToArchive[parseInt(index, 10)])
				.map(user => user.id)
		}

		const data = getSelectedRows()

		if (data.length) {
			console.log(data, ' data')
		}
	}, [rowSelection, archiveRequest.usersToArchive])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4 pt-4', className)}
			encType="multipart/form-data"
		>
			<Card className="space-y-2 pb-4 mb-2">
				<UsersToArchiveTable
					data={archiveRequest.usersToArchive}
					rowSelection={rowSelection}
					setRowSelection={setRowSelection}
				/>
			</Card>

			<InputField field={fields.usersToArchive} InputProps={{ hidden: true }} />

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					name="intent"
					value="archivate"
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
