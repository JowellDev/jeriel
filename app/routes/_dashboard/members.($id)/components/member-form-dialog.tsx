import * as React from 'react'
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
import { editMemberSchema } from '../schema'
import InputField from '~/components/form/input-field'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { SelectField } from '~/components/form/select-field'
import { FORM_INTENT } from '../constants'
import { type ActionType } from '../action.server'
import { type MemberFilterOptionsApiData } from '~/routes/api/get-members-select-options/_index'
import { useEffect, useState } from 'react'
import { type SelectOption } from '~/shared/types'
import { type MemberWithRelations } from '~/models/member.model'
import { toast } from 'sonner'
import { ScrollArea } from '~/components/ui/scroll-area'
import { format } from 'date-fns'

interface Props {
	member?: MemberWithRelations
	onClose: () => void
}

interface FormDependencies {
	honorFamilies: SelectOption[]
	departments: SelectOption[]
	tribes: SelectOption[]
}

interface MainFormProps extends React.ComponentProps<'form'> {
	isLoading: boolean
	member?: MemberWithRelations
	dependencies: FormDependencies
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
}

export default function MemberFormDialog({ onClose, member }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const { load, ...apiFetcher } = useFetcher<MemberFilterOptionsApiData>()
	const [dependencies, setDependencies] = useState<FormDependencies>({
		honorFamilies: [],
		departments: [],
		tribes: [],
	})

	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = member ? 'Modification du fidèle' : 'Nouveau fidèle'

	useEffect(() => {
		load('/api/get-members-select-options')
	}, [load])

	useEffect(() => {
		if (apiFetcher.state === 'idle' && apiFetcher.data) {
			setDependencies(apiFetcher.data)
		}
	}, [apiFetcher.data, apiFetcher.state])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success) {
			onClose?.()
			const message = member
				? 'Modification effectuée avec succès!'
				: 'Création effectuée avec succès!'

			toast.success(message, { duration: 3000 })
		}
	}, [fetcher.data, fetcher.state, member, onClose])

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
						member={member}
						isLoading={isSubmitting}
						fetcher={fetcher}
						dependencies={dependencies}
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
					member={member}
					isLoading={isSubmitting}
					fetcher={fetcher}
					className="px-4"
					dependencies={dependencies}
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
	member,
	className,
	isLoading,
	fetcher,
	dependencies,
	onClose,
}: Readonly<MainFormProps>) {
	const isEdit = !!member
	const formAction = isEdit ? `/members/${member?.id}` : '.'

	const [form, fields] = useForm({
		constraint: getZodConstraint(editMemberSchema),
		lastResult: fetcher.data?.lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: editMemberSchema })
		},
		id: 'edit-member-form',
		shouldRevalidate: 'onBlur',
		defaultValue: {
			name: member?.name,
			phone: member?.phone,
			location: member?.location,
			birthday: member?.birthday
				? format(new Date(member?.birthday), 'yyyy-MM-dd')
				: undefined,
			tribeId: member?.tribe?.id,
			departmentId: member?.department?.id,
			honorFamilyId: member?.honorFamily?.id,
		},
	})

	return (
		<fetcher.Form
			encType="multipart/form-data"
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4 mt-4', className)}
		>
			<ScrollArea className="flex-1 overflow-y-auto h-96 sm:h-full pr-3 pb-2">
				<div className="grid sm:grid-cols-2 gap-4">
					<InputField field={fields.name} label="Nom et prénoms" />
					<InputField field={fields.phone} label="Numéro de téléphone" />
					<InputField field={fields.location} label="Localisation" />
					<InputField
						field={fields.birthday}
						label="Date de naissance"
						type="date"
					/>
					<div className="sm:col-span-2">
						<InputField field={fields.picture} label="Photo" type="file" />
					</div>
					<div className="sm:col-span-2">
						<SelectField
							field={fields.tribeId}
							label="Tribu"
							placeholder="Sélectionner une tribu"
							items={dependencies.tribes}
						/>
					</div>
					<div className="sm:col-span-2">
						<SelectField
							field={fields.departmentId}
							label="Département"
							placeholder="Sélectionner un département"
							items={dependencies.departments}
						/>
					</div>
					<div className="sm:col-span-2">
						<SelectField
							field={fields.honorFamilyId}
							label="Famille d'honneur"
							placeholder="Sélectionner une famille d'honneur"
							items={dependencies.honorFamilies}
						/>
					</div>
				</div>
			</ScrollArea>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value={isEdit ? FORM_INTENT.EDIT : FORM_INTENT.CREATE}
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
