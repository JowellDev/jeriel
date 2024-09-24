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
import { type ComponentProps, useEffect, useRef, useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { createHonorFamilySchema } from '../schema'
import InputField from '~/components/form/input-field'
import { ACCEPTED_EXCEL_MIME_TYPES, MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { SelectField } from '~/components/form/select-field'
import { FORM_INTENT } from '../constants'
import { type ActionData } from '../action.server'
import PasswordInputField from '~/components/form/password-input-field'
import { type HonorFamily, type LoadingApiFormData } from '../types'
import { MultipleSelector, type Option } from '~/components/form/multi-selector'
import { formatAsSelectFieldsData, stringify } from '../utils'
import LoadingButton from '~/components/loading-button'
import { toast } from 'sonner'
import { RiFileExcel2Line } from '@remixicon/react'
import { Input } from '~/components/ui/input'

interface Props {
	onClose: (shouldReloade: boolean) => void
	honorFamily?: HonorFamily
}

export function HonoreFamilyFormDialog({ onClose, honorFamily }: Props) {
	const fetcher = useFetcher<ActionData>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = honorFamily
		? "Modifcation de la famille d'honeur"
		: 'Nouvelle famille d’honneur'

	useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle' && fetcher.data.success) {
			const message = fetcher.data.message
			toast.success(message)
			onClose(true)
		}
	}, [fetcher.data, fetcher.state, onClose])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={() => onClose(false)}>
				<DialogContent
					className="md:max-w-3xl overflow-y-auto max-h-[calc(100vh-10px)]"
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
						honorFamily={honorFamily}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={() => onClose(false)}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
				</DrawerHeader>
				<MainForm
					isLoading={isSubmitting}
					fetcher={fetcher}
					honorFamily={honorFamily}
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
	honorFamily,
	onClose,
}: ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionData>>
	honorFamily?: HonorFamily
	onClose?: (shouldReloade: boolean) => void
}) {
	const { load, data } = useFetcher<LoadingApiFormData>()

	const [fileName, setFileName] = useState<string | null>(null)
	const [fileError, setFileError] = useState<string | null>(null)
	const [showPasswordField, setShowPasswordField] = useState(
		!honorFamily?.manager.isAdmin,
	)
	const [selectedMembers, setSelectedMembers] = useState<Option[] | undefined>(
		!honorFamily?.members
			? undefined
			: formatAsSelectFieldsData(honorFamily.members),
	)

	const members = data?.members.concat(
		!honorFamily?.members ? [] : formatAsSelectFieldsData(honorFamily.members),
	)

	const admins = data?.admins.concat(
		!honorFamily?.manager
			? []
			: [
					{
						label: honorFamily.manager.name,
						value: honorFamily.manager.id,
						isAdmin: honorFamily.manager.isAdmin,
					},
				],
	)

	const formAction = honorFamily ? `./${honorFamily.id}` : '.'
	const schema = createHonorFamilySchema

	const fileInputRef = useRef<HTMLInputElement>(null)

	const [form, fields] = useForm({
		constraint: getZodConstraint(schema),
		lastResult: fetcher.data?.lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		id: 'create-honor-family-form',
		shouldRevalidate: 'onBlur',
		defaultValue: honorFamily
			? {
					name: honorFamily.name,
					location: honorFamily.location,
				}
			: {},
	})

	function handleMultiselectChange(options: Option[]) {
		setSelectedMembers(options)
		form.update({
			name: fields.membersId.name,
			value: stringify(
				options.length === 0 ? '' : options.map(option => option.value),
			),
		})
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

	function handleManagerChange(id: string) {
		const selectedManager = data?.admins.find(admin => admin.value === id)

		selectedManager?.isAdmin
			? setShowPasswordField(false)
			: setShowPasswordField(true)
	}

	useEffect(() => {
		load('/api/get-creating-honor-family-form-data')
		handleMultiselectChange(selectedMembers ?? [])
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<fetcher.Form
			method="post"
			action={formAction}
			encType="multipart/form-data"
			className={cn('grid items-start gap-4 mt-4', className)}
			{...getFormProps(form)}
		>
			<div className="grid sm:grid-cols-2 gap-4">
				<InputField field={fields.name} label="Nom de la famille d’honneur" />
				<InputField field={fields.location} label="Localisation" />
				<div>
					<SelectField
						field={fields.managerId}
						defaultValue={honorFamily?.manager.id}
						label="Responsable"
						placeholder="Selectionner un responsable"
						items={admins ?? []}
						onChange={handleManagerChange}
					/>
				</div>
				{showPasswordField ? (
					<PasswordInputField
						label="Mot de passe"
						field={fields.password}
						InputProps={{ className: 'bg-white' }}
					/>
				) : (
					<MultipleSelector
						label="Membres"
						value={selectedMembers}
						options={members}
						onChange={handleMultiselectChange}
						className="py-3.5"
						placeholder="Sélectionner un ou plusieurs fidèles"
						field={fields.membersId}
					/>
				)}
			</div>
			{showPasswordField && (
				<MultipleSelector
					label="Membres"
					value={selectedMembers}
					options={members}
					onChange={handleMultiselectChange}
					className="py-3.5"
					placeholder="Sélectionner un ou plusieurs fidèles"
					field={fields.membersId}
				/>
			)}
			<div
				className="border-2 rounded-md hover:bg-gray-100 hover:text-[#D1D1D1]-100 flex flex-col mt-1 items-center border-dashed border-gray-400 py-6 cursor-pointer"
				onClick={() => fileInputRef.current?.click()}
			>
				<div className="flex flex-col items-center">
					<RiFileExcel2Line
						color={`${fileName ? '#226C67' : '#D1D1D1'}`}
						size={80}
					/>
					<p className="text-sm mt-3">
						{fileName ?? 'Cliquer pour importer le fichier'}
					</p>
				</div>

				<Input
					type="file"
					className="hidden"
					name="membersFile"
					ref={fileInputRef}
					onChange={handleFileChange}
					accept={ACCEPTED_EXCEL_MIME_TYPES.join(',')}
				/>
			</div>
			{fileError && (
				<div className="text-red-500 text-center text-sm m-auto">
					{fileError}
				</div>
			)}
			<div className="flex items-center">
				<a href="/uploads/member-model.xlsx" download>
					<Button
						variant="ghost"
						type="button"
						className="border-none text-[#D1D1D1]-100 hover:bg-gray-100 hover:text-[#D1D1D1]-100"
					>
						<RiFileExcel2Line className="mr-2" color="#D1D1D1" size={20} />{' '}
						Télécharger le modèle de fichier
					</Button>
				</a>
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button
						disabled={isLoading}
						type="button"
						variant="outline"
						onClick={() => onClose(false)}
					>
						Fermer
					</Button>
				)}
				<LoadingButton
					loading={isLoading}
					loadingPosition="right"
					type="submit"
					value={honorFamily ? FORM_INTENT.EDIT : FORM_INTENT.CREATE}
					name="intent"
					variant="primary"
					disabled={isLoading || !!fileError}
					className="w-full sm:w-auto"
				>
					Enregister
				</LoadingButton>
			</div>
		</fetcher.Form>
	)
}
