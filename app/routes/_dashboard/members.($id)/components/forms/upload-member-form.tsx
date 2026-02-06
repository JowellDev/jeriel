import * as React from 'react'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useMediaQuery } from 'usehooks-ts'

import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useFetcher } from '@remix-run/react'

import { ButtonLoading } from '~/components/button-loading'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'
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
import { MOBILE_WIDTH } from '~/shared/constants'
import { cn } from '~/utils/ui'

import { FORM_INTENT } from '../../constants'
import { uploadMembersSchema } from '../../schema'
import { type ActionType } from '../../server/actions/action.server'

interface Props {
	onClose: () => void
}

export function UploadMemberForm({ onClose }: Readonly<Props>) {
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

interface MainFormProps extends React.ComponentProps<'form'> {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
}

function MainForm({
	className,
	isLoading,
	fetcher,
	onClose,
}: Readonly<MainFormProps>) {
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
			toast.success('Ajout effectuée avec succès.')
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
				<ButtonLoading
					type="submit"
					value={FORM_INTENT.UPLOAD}
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
