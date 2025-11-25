import { useMediaQuery } from 'usehooks-ts'
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { FORM_INTENT } from '../../constants'
import { type ActionType } from '../../server/action.server'
import { useEffect } from 'react'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { uploadMemberSchema } from '../../schema'
import { toast } from 'sonner'
import FieldError from '~/components/form/field-error'

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
						<DialogDescription></DialogDescription>
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
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
}) {
	function handleFileChange(file: any) {
		form.update({ name: 'file', value: file || undefined })
	}

	const [form, fields] = useForm({
		id: 'upload-member-form',
		lastResult: fetcher.data as SubmissionResult<string[]>,
		constraint: getZodConstraint(uploadMemberSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: uploadMemberSchema })
		},
	})

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success('Ajout effectuée avec succès.')
			onClose?.()
		}
	}, [fetcher.data, fetcher.state, onClose])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action="."
			className={cn('grid items-start gap-4', className)}
			encType="multipart/form-data"
		>
			<ExcelFileUploadField
				name={fields.file.name}
				onFileChange={handleFileChange}
			/>

			<FieldError field={fields.file} className="-mt-4" />

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
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
