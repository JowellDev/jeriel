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
import { createTribeSchema } from '../schema'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { RiFileExcelLine } from '@remixicon/react'
import { Input } from '~/components/ui/input'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MultipleSelector, type Option } from '~/components/form/multi-selector'
import { type ActionType } from '../action.server'

import { stringify, transformApiData } from '../utils'
import { toast } from 'sonner'
import type { ApiFormData, Tribe } from '../types'
import PasswordInputField from '~/components/form/password-input-field'
import { useApiData } from '~/hooks/api-data.hook'
import { FORM_INTENT } from '../constants'

interface Props {
	onClose: (reloadData: boolean) => void
	tribe?: Tribe
}

export function TribeFormDialog({ onClose, tribe }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = tribe ? `Modifier la tribu ${tribe.name}` : 'Nouvelle tribu'

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success) {
			const message = fetcher.data.message
			message && toast.success(message)
			onClose(true)
		}
	}, [fetcher.state, fetcher.data, onClose])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
					showCloseButton={false}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						isLoading={isSubmitting}
						fetcher={fetcher}
						onClose={onClose}
						tribe={tribe}
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
					fetcher={fetcher}
					tribe={tribe}
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
	fetcher,
	onClose,
	tribe,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: (reloadData: boolean) => void
	tribe?: Tribe
}) {
	const editMode = !!tribe

	const formAction = editMode ? `./${tribe?.id}` : '.'
	const schema = createTribeSchema

	const apiData = useApiData<ApiFormData>('/api/get-members')

	const [showPasswordField, setShowPasswordField] = useState(
		!tribe?.manager.isAdmin,
	)
	const [selectedMembers, setSelectedMembers] = useState<Option[]>(
		tribe?.members ? transformApiData(tribe.members) : [],
	)

	const allMembers = useMemo(() => {
		if (apiData.isLoading || !apiData.data) return []
		return transformApiData(apiData.data.members)
	}, [apiData.data, apiData.isLoading])

	const allAdmins = useMemo(() => {
		if (apiData.isLoading || !apiData.data) return []
		const apiAdmins = transformApiData(apiData.data.admins)
		if (tribe?.manager) {
			return apiAdmins.some(admin => admin.value === tribe.manager.id)
				? apiAdmins
				: [...apiAdmins, { label: tribe.manager.name, value: tribe.manager.id }]
		}
		return apiAdmins
	}, [apiData.data, apiData.isLoading, tribe])

	const [fileName, setFileName] = useState<string | null>(null)
	const [fileError, setFileError] = useState<string | null>(null)
	const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleClick = () => {
		fileInputRef.current?.click()
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFileError(null)
		setFileName(null)
		const files = e.target.files
		if (files && files.length > 0) {
			validateFiles(files)
		}
	}

	const validateFiles = (files: FileList) => {
		const file = files[0]
		const fileType = file.name.split('.').pop() ?? ''

		if (!['xlsx'].includes(fileType)) {
			setFileError('Le fichier doit être de type Excel')
			setFileName(null)
		}
		setFileName(file.name)
	}

	const handleDownloadLink = () => {
		setIsDownloadingTemplate(true)

		const downloadLink = document.querySelector(
			'[data-testid="download-link"]',
		) as HTMLAnchorElement

		downloadLink.click()
	}

	function handleMultiselectChange(options: Option[]) {
		setSelectedMembers(options)
		form.update({
			name: fields.memberIds.name,
			value: stringify(options.map(option => option.value)),
		})
	}

	const [form, fields] = useForm({
		lastResult: fetcher.data?.lastResult,
		id: 'edit-tribe-form',
		constraint: getZodConstraint(schema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		shouldRevalidate: 'onBlur',
		defaultValue: tribe
			? {
					name: tribe.name,
				}
			: {},
	})

	function handleManagerChange(id: string) {
		const selectedManager = apiData.data?.admins.find(admin => admin.id === id)
		setShowPasswordField(!selectedManager?.isAdmin)
	}

	useEffect(() => {
		if (tribe) {
			setShowPasswordField(tribe.manager.isAdmin)
			handleMultiselectChange(transformApiData(tribe.members))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tribe])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			encType="multipart/form-data"
			className={cn('grid items-start gap-4', className)}
		>
			<div className="grid sm:grid-cols-2 gap-4">
				<InputField field={fields.name} label="Nom" />
				<SelectField
					field={fields.tribeManagerId}
					label="Responsable"
					placeholder="Sélectionner un responsable"
					items={allAdmins}
					onChange={handleManagerChange}
					defaultValue={tribe?.manager.id}
				/>
				{showPasswordField ? (
					<>
						<PasswordInputField
							label="Mot de passe"
							field={fields.password}
							InputProps={{ className: 'bg-white' }}
						/>
						<MultipleSelector
							label="Membres"
							field={fields.memberIds}
							options={allMembers}
							placeholder="Sélectionner un ou plusieurs fidèles"
							testId="tribe-multi-selector"
							className="py-3.5"
							onChange={handleMultiselectChange}
							value={selectedMembers}
						/>
					</>
				) : (
					<div className="col-span-2">
						<MultipleSelector
							label="Membres"
							field={fields.memberIds}
							options={allMembers}
							placeholder="Sélectionner un ou plusieurs fidèles"
							testId="tribe-multi-selector"
							className="py-3.5"
							onChange={handleMultiselectChange}
							value={selectedMembers}
						/>
					</div>
				)}
			</div>
			<div
				className="border-2 flex flex-col mt-1 items-center border-dashed border-gray-400 py-20 cursor-pointer"
				onClick={handleClick}
			>
				<div className="flex flex-col items-center">
					<RiFileExcelLine
						color={`${fileName ? '#226C67' : '#D1D1D1'}`}
						size={80}
					/>
					<p className="text-sm mt-3">
						{fileName ?? 'Importer uniquement un fichier de type Excel'}
					</p>
				</div>

				<Input
					type="file"
					className="hidden"
					name="membersFile"
					ref={fileInputRef}
					onChange={handleFileChange}
					accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
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
					href="/uploads/member-model.xlsx"
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
					<Button
						type="button"
						variant="outline"
						onClick={() => onClose(false)}
					>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value={editMode ? FORM_INTENT.UPDATE_TRIBE : FORM_INTENT.CREATE_TRIBE}
					name="intent"
					variant="primary"
					disabled={isLoading || !!fileError || !!isDownloadingTemplate}
					className="w-full sm:w-auto"
				>
					{editMode ? 'Modifier' : 'Créer'}
				</Button>
			</div>
		</fetcher.Form>
	)
}
