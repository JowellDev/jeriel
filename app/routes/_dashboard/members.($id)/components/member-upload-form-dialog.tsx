import * as React from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useFetcher } from '@remix-run/react'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '~/components/ui/drawer'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import { uploadMembersSchema } from '../schema'
import { MOBILE_WIDTH } from '~/shared/constants'
import { FORM_INTENT } from '../constants'
import { type ActionType } from '../action.server'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'

interface Props {
	onClose: () => void
}

export default function MemberUploadFormDialog({ onClose }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()

	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Importation de fidèles'

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl"
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
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<any>>
	onClose?: () => void
}) {
	const [form, fields] = useForm({
		id: 'upload-member-form',
		lastResult: fetcher.data as SubmissionResult<string[]>,
		constraint: getZodConstraint(uploadMembersSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: uploadMembersSchema })
		},
	})

	const handleFileChange = useCallback(
		(file: any) => {
			form.update({ name: 'file', value: file || undefined })
		},
		[form],
	)

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			onClose?.()
			toast.success('Ajout effectuée avec succès')
		} else if (fetcher.data && fetcher.state === 'idle' && fetcher.data.error) {
			const errorMessage = Array.isArray(fetcher.data.error)
				? fetcher.data.error.join(', ')
				: fetcher.data.error

			toast.error(errorMessage)
		}
	}, [fetcher.data, fetcher.state, onClose])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action="."
			encType="multipart/form-data"
			className={cn('grid items-start gap-4', className)}
		>
			<ExcelFileUploadField
				name={fields.file.name}
				onFileChange={handleFileChange}
				modelFilePath="/uploads/church_members_model.xlsx"
			/>
			<div className="sm:flex sm:justify-end sm:space-x-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value={FORM_INTENT.UPLOAD}
					name="intent"
					variant="primary"
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Enregister
				</Button>
			</div>
		</fetcher.Form>
	)
}
