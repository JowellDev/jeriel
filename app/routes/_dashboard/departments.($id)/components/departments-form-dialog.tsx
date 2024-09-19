import { useMediaQuery } from 'usehooks-ts'

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
import { Button } from '~/components/ui/button'
import { useFetcher } from '@remix-run/react'
import type { ActionType } from '../action.server'
import type { Department } from '../model'
import { MOBILE_WIDTH } from '~/shared/constants'
import MainForm from './main-form'
import { useEffect } from 'react'

interface Props {
	onClose: () => void
	department?: Department
}

export function DepartmentsFormDialog({ onClose, department }: Props) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = department ? `Modifier le département` : 'Nouveau département'

	useEffect(() => {
		if (fetcher.data && fetcher.state === 'idle' && !fetcher.data.error) {
			onClose()
		}
	}, [fetcher.data, fetcher.state, onClose])

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
						department={department}
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
				<MainForm
					isLoading={isSubmitting}
					department={department}
					fetcher={fetcher}
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

// function MainForm({
// 	className,
// 	isLoading,
// 	department,
// 	fetcher,
// 	onClose,
// }: React.ComponentProps<'form'> & {
// 	isLoading: boolean
// 	department?: Department
// 	fetcher: ReturnType<typeof useFetcher<ActionType>>
// 	onClose?: () => void
// }) {
// 	const lastSubmission = fetcher.data as any

// 	const apiData = useApiData<{ members: Member[]; admins: Member[] }>(
// 		'/api/get-members',
// 	)

// 	const [members, setMembers] = useState<{ label: string; value: string }[]>([])

// 	const [isManualSelectionMode, setIsManualSelectionMode] =
// 		useState<boolean>(true)

// 	const formAction = department ? `./${department.id}` : '.'

// 	const schema = department ? updateDepartmentSchema : createDepartmentSchema

// 	const [form, fields] = useForm({
// 		constraint: getZodConstraint(schema),
// 		lastResult: lastSubmission,
// 		onValidate({ formData }) {
// 			return parseWithZod(formData, { schema })
// 		},
// 		id: 'department-form',
// 		shouldRevalidate: 'onBlur',
// 		defaultValue: {
// 			name: department?.name,
// 		},
// 	})

// 	function handleMultiselectChange(options: Option[]) {
// 		form.update({
// 			name: 'members',
// 			value: JSON.stringify(
// 				options.length === 0 ? '' : options.map(option => option.value),
// 			),
// 		})
// 	}

// 	function handleFileChange(file: any) {
// 		form.update({
// 			name: 'membersFile',
// 			value: file,
// 		})
// 	}

// 	useEffect(() => {
// 		if (!apiData.isLoading && apiData.data) {
// 			const allMembers = transformApiData(apiData.data.members ?? [])
// 			setMembers(allMembers)
// 		}
// 	}, [apiData.data, apiData.isLoading])

// 	return (
// 		<fetcher.Form
// 			{...getFormProps(form)}
// 			method="post"
// 			action={formAction}
// 			className={cn('grid items-start gap-4 pt-4', className)}
// 			autoComplete="off"
// 		>
// 			<div className="flex flex-wrap sm:flex-nowrap gap-4">
// 				<InputField field={fields.name} label="Nom" />
// 				<SelectField
// 					field={fields.managerId}
// 					label="Responsable"
// 					placeholder="Sélectionner le responsable"
// 					items={members}
// 				/>
// 			</div>

// 			<div className="flex flex-wrap sm:flex-nowrap gap-4">
// 				<PasswordInputField
// 					label="Mot de passe"
// 					field={fields.password}
// 					InputProps={{ autoComplete: 'new-password' }}
// 				/>
// 				<PasswordInputField
// 					label="Confirmer le mot de passe"
// 					field={fields.passwordConfirm}
// 				/>
// 			</div>

// 			<div className="mt-4">
// 				<div className="flex items-center gap-4">
// 					<Label
// 						className={cn({ 'label-required': fields.members.required })}
// 						htmlFor={fields.members.id}
// 					>
// 						Membres
// 					</Label>

// 					<div className="flex items-center gap-4">
// 						<Switch
// 							checked={isManualSelectionMode}
// 							className="data-[state=checked]:bg-green-500"
// 							onCheckedChange={value => setIsManualSelectionMode(value)}
// 						/>
// 						<span className="text-xs">
// 							{isManualSelectionMode
// 								? 'Sélection manuelle'
// 								: 'Import par fichier'}
// 						</span>
// 					</div>
// 				</div>
// 				{isManualSelectionMode ? (
// 					<MultipleSelector
// 						field={fields.members}
// 						options={members}
// 						placeholder="Sélectionner un ou plusieurs fidèles"
// 						testId="department-multi-selector"
// 						className="py-3.5 mt-4"
// 						onChange={handleMultiselectChange}
// 						listPosition={'bottom'}
// 					/>
// 				) : (
// 					<ExcelFileUploadField
// 						name="upload-members"
// 						className="mt-8"
// 						onFileChange={handleFileChange}
// 					/>
// 				)}
// 				<FieldError className={cn('text-xs')} field={fields.members} />
// 			</div>

// 			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
// 				{onClose && (
// 					<Button type="button" variant="outline" onClick={onClose}>
// 						Fermer
// 					</Button>
// 				)}
// 				<Button
// 					type="submit"
// 					value={department ? 'update' : 'create'}
// 					name="intent"
// 					variant="primary"
// 					disabled={isLoading}
// 					className="w-full sm:w-auto"
// 				>
// 					Enregister
// 				</Button>
// 			</div>
// 		</fetcher.Form>
// 	)
// }
