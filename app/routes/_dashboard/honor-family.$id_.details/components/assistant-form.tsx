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
import { cn } from '~/utils/ui'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { FORM_INTENT } from '../constants'
import { type ActionType } from '../action.server'
import { SelectField } from '~/components/form/select-field'
import PasswordInputField from '~/components/form/password-input-field'
import { useEffect } from 'react'
import { SelectInputData } from '../types'
import { addAssistantSchema } from '../schema'

interface Props {
	onClose: () => void
	honorFamilyId: string
	membersOption: SelectInputData[]
}

export function AssistantFormDialog({
	onClose,
	honorFamilyId,
	membersOption,
}: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Nouvel assistant'

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
						honorFamilyId={honorFamilyId}
						membersOption={membersOption}
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
					honorFamilyId={honorFamilyId}
					membersOption={membersOption}
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
	honorFamilyId,
	membersOption,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
	honorFamilyId: string
	membersOption: SelectInputData[]
}) {
	const formAction = `/honor-family/${honorFamilyId}/details`
	const schema = addAssistantSchema

	const [form, fields] = useForm({
		constraint: getZodConstraint(schema),
		lastResult: fetcher.data?.lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		id: 'add-assistant-form',
		shouldRevalidate: 'onBlur',
	})

	useEffect(() => {
		if (fetcher.data?.success) {
			onClose?.()
		}
	}, [fetcher.data, onClose])

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
						items={membersOption}
					/>
					<PasswordInputField
						label="Mot de passe"
						field={fields.password}
						InputProps={{ className: 'bg-white' }}
					/>
				</div>
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value={FORM_INTENT.ADD_ASSISTANT}
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
