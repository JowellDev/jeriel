import { getFormProps, useForm } from '@conform-to/react'
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
import { CreateTribeSchema } from '../schema'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { RiFileExcelLine } from '@remixicon/react'
import { Input } from '~/components/ui/input'
import { useRef, useState } from 'react'
import {
	MultipleSelector,
	type MultipleSelectorRef,
} from '~/components/form/multi-selector'

interface Props {
	onClose: () => void
}

export function TribeFormDialog({ onClose }: Readonly<Props>) {
	const fetcher = useFetcher()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Nouvelle tribu'

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
	const lastSubmission = fetcher.data as any
	const formAction = '.'
	const schema = CreateTribeSchema

	const [fileError, setFileError] = useState<string | null>(null)
	const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const multiselectorInputRef = useRef<MultipleSelectorRef>(null)

	const handleClick = () => {
		fileInputRef.current?.click()
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFileError(null)
		const files = e.target.files
		if (files && files.length > 0) {
			validateFiles(files)
		}
	}

	const validateFiles = (files: FileList) => {
		const file = files[0]
		const fileType = file.name.split('.').pop() ?? ''

		if (!['csv', 'xlsx'].includes(fileType)) {
			setFileError('Le fichier doit être de type .csv ou .xlsx')
		}
	}

	const handleDownloadLink = () => {
		setIsDownloadingTemplate(true)

		const downloadLink = document.querySelector(
			'[data-testid="download-link"]',
		) as HTMLAnchorElement

		downloadLink.click()
	}

	const [form, fields] = useForm({
		constraint: getZodConstraint(schema),
		lastResult: lastSubmission,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		id: 'edit-tribe-form',
		shouldRevalidate: 'onBlur',
	})

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4', className)}
		>
			<div className="grid sm:grid-cols-2 gap-4">
				<InputField field={fields.name} label="Nom" />
				<SelectField
					field={fields.managerTibeId}
					label="Responsable"
					placeholder="Sélectionner un responsable"
					items={[
						{ value: '1', label: 'John Doe' },
						{ value: '2', label: 'John Doe' },
					]}
				/>
				<InputField field={fields.password} label="Mot de passe" />

				<MultipleSelector
					value={[]}
					placeholder="Sélectionner un ou plusieurs fidèles"
					testId="tribe-multi-selector"
					className="py-[0.86rem] mt-7"
					triggerSearchOnFocus
					ref={multiselectorInputRef}
				/>

				<div className="mt-[-0.6rem]">
					<InputField
						field={fields.memberIds}
						InputProps={{ hidden: true }}
						label="me"
					/>
				</div>
			</div>
			<div
				className="border-2 flex flex-col mt-1 items-center border-dashed border-gray-400 py-20 cursor-pointer"
				onClick={handleClick}
			>
				<div className="flex flex-col items-center">
					<RiFileExcelLine size={80} />
					<p className="text-sm mt-3">
						Importer uniquement un fichier de type Excel
					</p>
				</div>

				<Input
					type="file"
					className="hidden"
					name="membersFile"
					ref={fileInputRef}
					onChange={handleFileChange}
					accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
				/>
			</div>
			{fileError && (
				<div className="text-red-500 text-center text-sm m-auto">
					{fileError}
				</div>
			)}
			<div className="flex items-center">
				<RiFileExcelLine color="#D1D1D1" size={35} />

				<a
					href="/images/auth-bg.png"
					download
					data-testid="download-link"
					className="hidden"
				>
					{}
				</a>
				<Button
					data-testid="download-btn"
					variant="ghost"
					type="button"
					className="border-none text-[#D1D1D1]-100 hover:bg-gray-100 hover:text-[#D1D1D1]-100"
					onClick={handleDownloadLink}
				>
					Télécharger le modèle de fichier
				</Button>
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value="create"
					name="intent"
					variant="primary"
					disabled={isLoading || !!fileError}
					className="w-full sm:w-auto"
				>
					Enregister
				</Button>
			</div>
		</fetcher.Form>
	)
}
