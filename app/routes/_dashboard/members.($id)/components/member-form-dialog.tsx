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
import { createMemberSchema } from '../schema'
import InputField from '~/components/form/input-field'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { SelectField } from '~/components/form/select-field'
import { FORM_INTENT } from '../constants'
import { type ActionType } from '../action.server'
import { type MemberFilterOptionsApiData } from '~/routes/api/get-members-filter-select-options/_index'
import { useEffect, useState } from 'react'
import { type SelectOption } from '~/shared/types'

interface Props {
	onClose: () => void
}

interface FormDependencies {
	honorFamilies: SelectOption[]
	departments: SelectOption[]
	tribes: SelectOption[]
}

export function MemberFormDialog({ onClose }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const { load, ...apiFetcher } = useFetcher<MemberFilterOptionsApiData>()
	const [dependencies, setDependencies] = useState<FormDependencies>({
		honorFamilies: [],
		departments: [],
		tribes: [],
	})

	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Nouveau fidèle'

	useEffect(() => {
		load('/api/get-members-filter-select-options')
	}, [load])

	useEffect(() => {
		if (apiFetcher.state === 'idle' && apiFetcher.data) {
			setDependencies(apiFetcher.data)
		}
	}, [apiFetcher.data, apiFetcher.state])

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
	className,
	isLoading,
	fetcher,
	dependencies,
	onClose,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	dependencies: FormDependencies
	onClose?: () => void
}) {
	const formAction = '.'
	const schema = createMemberSchema

	const [form, fields] = useForm({
		constraint: getZodConstraint(schema),
		lastResult: fetcher.data?.lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		id: 'edit-member-form',
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
				<InputField field={fields.name} label="Nom et prénoms" />
				<InputField field={fields.phone} label="Numéro de téléphone" />
				<InputField field={fields.location} label="Localisation" />
				<SelectField
					field={fields.tribeId}
					label="Tribu"
					placeholder="Sélectionner une tribu"
					items={dependencies.tribes}
				/>
				<SelectField
					field={fields.departmentId}
					label="Département"
					placeholder="Sélectionner un département"
					items={dependencies.departments}
				/>
				<SelectField
					field={fields.honorFamilyId}
					label="Famille d'honneur"
					placeholder="Sélectionner une famille d'honneur"
					items={dependencies.honorFamilies}
				/>
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value={FORM_INTENT.CREATE}
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
