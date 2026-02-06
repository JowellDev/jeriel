import { useEffect, useState } from 'react'
import { useFetcher } from '@remix-run/react'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { toast } from 'sonner'
import { useMediaQuery } from 'usehooks-ts'

import { Button } from '~/components/ui/button'
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
import { ButtonLoading } from '~/components/button-loading'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'
import { MOBILE_WIDTH } from '~/shared/constants'
import { cn } from '~/utils/ui'

import { FORM_INTENT } from '../../constants'
import { uploadMemberSchema } from '../../schema'
import { type ActionType } from '../../server/action.server'

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
	const [error, setError] = useState<string | null>(null)
	const formAction = `/honor-family`

	function handleFileChange(file: any) {
		form.update({ name: 'file', value: file || undefined })
		setError(null)
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
	}, [fetcher.state, fetcher.data, onClose])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4', className)}
			encType="multipart/form-data"
		>
			<ExcelFileUploadField
				name={fields.file.name}
				onFileChange={handleFileChange}
			/>

			{error && (
				<div className="text-red-500 text-center text-xs mt-1">{error}</div>
			)}

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
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
