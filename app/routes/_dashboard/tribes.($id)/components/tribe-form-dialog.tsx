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

import { useEffect, useState } from 'react'
import { MultipleSelector, type Option } from '~/components/form/multi-selector'
import { type ActionType } from '../action.server'

import { stringify, transformApiData } from '../utils'
import { toast } from 'sonner'
import type { ApiFormData, Tribe } from '../types'
import PasswordInputField from '~/components/form/password-input-field'
import { FORM_INTENT } from '../constants'
import ExcelFileUploadField from '~/components/form/excel-file-upload-field'

interface Props {
	onClose: (reloadData: boolean) => void
	tribe?: Tribe
}

export function TribeFormDialog({ onClose, tribe }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = tribe ? `Modifier la tribu ${tribe.name}` : 'Créer une tribu'

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

	const formAction = tribe ? `./${tribe?.id}` : '.'
	const schema = createTribeSchema

	const { load, data } = useFetcher<ApiFormData>()

	const [showPasswordField, setShowPasswordField] = useState(
		!tribe?.manager.isAdmin,
	)
	const [selectedMembers, setSelectedMembers] = useState<Option[] | undefined>(
		!tribe?.members ? undefined : transformApiData(tribe.members),
	)

	const allMembers = data?.members.concat(
		!tribe?.members ? [] : transformApiData(tribe.members),
	)

	const allAdmins = data?.admins.concat(
		!tribe?.manager
			? []
			: [
					{
						label: tribe.manager.name,
						value: tribe.manager.id,
						isAdmin: tribe.manager.isAdmin,
					},
				],
	)

	function handleMultiselectChange(options: Option[]) {
		setSelectedMembers(options)
		form.update({
			name: fields.memberIds.name,
			value: stringify(
				options.length === 0 ? '' : options.map(option => option.value),
			),
		})
	}

	const [form, fields] = useForm({
		lastResult: fetcher.data?.lastResult,
		id: 'edit-tribe-form',
		constraint: getZodConstraint(schema),
		shouldRevalidate: 'onBlur',
		defaultValue: tribe ? { name: tribe.name } : {},
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
	})

	function handleFileChange(file: any) {
		form.update({ name: 'file', value: file || undefined })
	}

	function handleManagerChange(id: string) {
		const selectedManager = allAdmins?.find(admin => admin.value === id)
		setShowPasswordField(selectedManager ? !selectedManager.isAdmin : true)
	}

	useEffect(() => {
		load('/api/get-members')
		handleMultiselectChange(selectedMembers ?? [])
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

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
					items={allAdmins ?? []}
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
			<ExcelFileUploadField
				name={fields.membersFile.name}
				onFileChange={handleFileChange}
			/>

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
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Enrégistrer
				</Button>
			</div>
		</fetcher.Form>
	)
}
