import { useMediaQuery } from 'usehooks-ts'
import { useCallback, useEffect, useState } from 'react'
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
import { cn } from '~/utils/ui'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { addAssistantSchema } from '../../schema'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { FORM_INTENT } from '../../constants'
import { type ActionType } from '../../server/action.server'
import { SelectField } from '~/components/form/select-field'
import PasswordInputField from '~/components/form/password-input-field'
import { toast } from 'sonner'
import { ButtonLoading } from '~/components/button-loading'
import { type SelectOption } from '~/shared/types'
import InputField from '~/components/form/input-field'
import { type GetDepartmentAddableAssistantsLoaderData } from '~/routes/api/get-department-addable-assistants/_index'

interface Props {
	onClose: () => void
	departmentId: string
}

interface MainFormProps extends React.ComponentProps<'form'> {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	departmentId: string
	onClose?: () => void
}

export function EditAssistantForm({ onClose, departmentId }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Nouvel assistant'

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.status === 'success') {
			toast.success('Ajout effectuée avec succès.')
			onClose?.()
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
						departmentId={departmentId}
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
					fetcher={fetcher}
					className="px-4"
					departmentId={departmentId}
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
	departmentId,
}: Readonly<MainFormProps>) {
	const { load, data: membersData } =
		useFetcher<GetDepartmentAddableAssistantsLoaderData>()
	const formAction = `/departments/${departmentId}/details`

	const [memberOptions, setMemberOptions] = useState<SelectOption[]>([])
	const [requestPassword, setRequestPassword] = useState(true)
	const [requestEmail, setRequestEmail] = useState(true)

	const getOptions = useCallback(
		(data: { id: string; name: string }[] | undefined) => {
			return (
				data?.map(member => ({ label: member.name, value: member.id })) || []
			)
		},
		[],
	)

	const [form, fields] = useForm({
		id: 'add-department-assistant-form',
		shouldRevalidate: 'onBlur',
		constraint: getZodConstraint(addAssistantSchema),
		lastResult: fetcher.data as SubmissionResult<string[]>,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: addAssistantSchema })
		},
	})

	const handleAssistantChange = useCallback(
		(id: string) => {
			const selectedMember = membersData?.find(m => m.id === id)
			setRequestPassword(!selectedMember?.isAdmin)
			setRequestEmail(!selectedMember?.email)
		},
		[membersData],
	)

	useEffect(() => {
		load(`/api/get-department-addable-assistants?departmentId=${departmentId}`)
	}, [departmentId, load])

	useEffect(() => {
		if (membersData) {
			setMemberOptions(getOptions(membersData))
		}
	}, [membersData, getOptions])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4', className)}
		>
			<div className="grid sm:grid-cols-2 gap-4">
				<div className="col-span-2">
					<SelectField
						field={fields.memberId}
						label="Assistant"
						placeholder="Sélectionner un assistant"
						items={memberOptions}
						onChange={handleAssistantChange}
					/>
					{requestEmail && (
						<div className="flex flex-wrap sm:flex-nowrap gap-4">
							<InputField field={fields.email} label="Email" type="email" />
						</div>
					)}

					{requestPassword && (
						<div className="flex flex-wrap sm:flex-nowrap gap-4">
							<PasswordInputField
								label="Mot de passe"
								field={fields.password}
							/>
						</div>
					)}
				</div>
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<ButtonLoading
					type="submit"
					value={FORM_INTENT.ADD_ASSISTANT}
					name="intent"
					variant="primary"
					loading={isLoading}
					className="w-full sm:w-auto"
				>
					Enregister
				</ButtonLoading>
			</div>
		</fetcher.Form>
	)
}
