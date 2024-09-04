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
import { useEffect, useRef, useState } from 'react'
import {
	MultipleSelector,
	type MultipleSelectorRef,
	type Option,
} from '~/components/form/multi-selector'
import { type ActionType } from '../action.server'
import { useApiData } from '~/hooks/api-data.hook'
import { type Role } from '@prisma/client'
import { stringify, transformApiData } from '../utils'
import { toast } from 'sonner'
import { type Tribe } from '../types'

interface Props {
	onClose: () => void
	tribe?: Tribe
}

export function TribeFormDialog({ onClose, tribe }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const editMode = !!tribe
	const title = editMode ? `Modifier la tribu ${tribe.name}` : 'Nouvelle tribu'

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success) {
			const message = fetcher.data.message
			message && toast.success(message)
			onClose()
		}
	}, [fetcher.state, fetcher.data, onClose])

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

interface Member {
	id: string
	name: string
	roles?: Role[]
	phone: string
	isAdmin: boolean
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
	onClose?: () => void
	tribe?: Tribe
}) {
	const formAction = '.'
	const schema = createTribeSchema

	const apiData = useApiData<{ members: Member[]; admins: Member[] }>(
		'/api/get-members',
	)

	const [allMembers, setAllMembers] = useState<Option[]>([])
	const [allAdmins, setAllAdmins] = useState<Option[]>([])
	const [selectedMembers, setSelectedMembers] = useState<Option[]>([])
	const [selectedManager, setSelectedManager] = useState<Member | null>(null)
	const [selectedManagerId, setSelectedManagerId] = useState<string>('')
	const multiselectorInputRef = useRef<MultipleSelectorRef>(null)

	useEffect(() => {
		if (!apiData.isLoading && apiData.data) {
			const apiMembers = transformApiData(apiData.data.members ?? [])
			const apiAdmins = transformApiData(apiData.data.admins ?? [])

			setAllMembers(apiMembers)
			setAllAdmins(apiAdmins)

			if (tribe) {
				setSelectedManagerId(tribe.manager.id)

				console.log('allAdmins', selectedManagerId)
				const tribeMembers = tribe.members.map(member => ({
					label: member.name,
					value: member.id,
				}))
				setSelectedMembers(tribeMembers)
			}
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [apiData.data, apiData.isLoading])

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
			name: 'memberIds',
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
		defaultValue: {
			name: tribe?.name ?? '',
			tribeManagerId: tribe?.manager?.id ?? '',
			memberIds: stringify(tribe?.members.map(member => member.id) ?? []),
		},
	})

	const handleManagerChange = (managerId: string) => {
		const selectedManager =
			apiData.data?.admins.find(member => member.id === managerId) || null

		setSelectedManager(selectedManager)

		const updatedMembers = selectedMembers.filter(
			member => member.value !== managerId,
		)

		setSelectedMembers(updatedMembers)
		handleMultiselectChange([])
	}
	const showPasswordField = !selectedManager?.isAdmin

	const availableMembers = [
		...allMembers,
		...selectedMembers.filter(
			member => !allMembers.some(m => m.value === member.value),
		),
	]

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
					value={tribe?.manager.id}
				/>
				{showPasswordField ? (
					<>
						<InputField field={fields.password} label="Mot de passe" />
						<MultipleSelector
							label="Membres"
							field={fields.memberIds}
							options={availableMembers}
							placeholder="Sélectionner un ou plusieurs fidèles"
							testId="tribe-multi-selector"
							className="py-3.5"
							onChange={handleMultiselectChange}
							ref={multiselectorInputRef}
							value={selectedMembers}
						/>
					</>
				) : (
					<div className="col-span-2">
						<MultipleSelector
							label="Membres"
							field={fields.memberIds}
							options={availableMembers}
							placeholder="Sélectionner un ou plusieurs fidèles"
							testId="tribe-multi-selector"
							className="py-3.5"
							onChange={handleMultiselectChange}
							ref={multiselectorInputRef}
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
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value="create"
					name="intent"
					variant="primary"
					disabled={isLoading || !!fileError || !!isDownloadingTemplate}
					className="w-full sm:w-auto"
				>
					Enregister
				</Button>
			</div>
		</fetcher.Form>
	)
}
