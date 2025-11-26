import { useEffect, useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'

import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useFetcher } from '@remix-run/react'

import { SelectField } from '~/components/form/select-field'
import { Button } from '~/components/ui/button'
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
import { type MemberFilterOptionsApiData } from '~/routes/api/get-members-select-options/_index'
import { MOBILE_WIDTH } from '~/shared/constants'
import { statusFilterData } from '~/shared/filter'
import { type SelectOption } from '~/shared/types'
import { cn } from '~/utils/ui'

import { filterSchema } from '../../schema'
import { type MemberFilterOptions } from '../../types'

interface Options {
	departments: SelectOption[]
	honorFamilies: SelectOption[]
	tribes: SelectOption[]
}

interface FilterFormProps {
	defaultValues: MemberFilterOptions
	onClose: () => void
	onSubmit: (payload: MemberFilterOptions) => void
}

interface MainFormProps {
	options: Options
	defaultValues: MemberFilterOptions
	className?: string
	onSubmit: (payload: MemberFilterOptions) => void
	onClose?: () => void
}

export function FilterForm(props: Readonly<FilterFormProps>) {
	const { load, ...apiFetcher } = useFetcher<MemberFilterOptionsApiData>()
	const [options, setOptions] = useState<Options>({
		honorFamilies: [],
		departments: [],
		tribes: [],
	})

	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	const title = 'Filtre des fidèles'

	useEffect(() => {
		load('/api/get-members-select-options')
	}, [load])

	useEffect(() => {
		if (apiFetcher.state === 'idle' && apiFetcher.data) {
			setOptions(apiFetcher.data)
		}
	}, [apiFetcher.data, apiFetcher.state])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={props.onClose}>
				<DialogContent
					className="md:max-w-xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						options={options}
						defaultValues={props.defaultValues}
						onClose={props.onClose}
						onSubmit={props.onSubmit}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={props.onClose}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
				</DrawerHeader>
				<MainForm
					options={options}
					defaultValues={props.defaultValues}
					onSubmit={props.onSubmit}
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
	options,
	defaultValues,
	className,
	onSubmit,
	onClose,
}: Readonly<MainFormProps>) {
	const fetcher = useFetcher()

	const isLoading = ['loading', 'submitting'].includes(fetcher.state)

	const [form, fields] = useForm({
		id: 'filter-member-form',
		shouldRevalidate: 'onBlur',
		constraint: getZodConstraint(filterSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: filterSchema })
		},
		onSubmit(event, { submission }) {
			event.preventDefault()
			const payload = (submission?.payload ??
				{}) as unknown as MemberFilterOptions
			onSubmit(payload)
		},
	})

	function formatSelectOptions(allLabel: string, options?: SelectOption[]) {
		return [{ value: 'ALL', label: allLabel }, ...(options ?? [])]
	}

	return (
		<fetcher.Form
			{...getFormProps(form)}
			className={cn('grid items-start gap-4 mt-4', className)}
		>
			<div className="grid gap-4">
				<SelectField
					label="Départements"
					field={fields.departmentId}
					defaultValue={defaultValues?.departmentId}
					placeholder="Sélectionner un département"
					items={formatSelectOptions(
						'Tous les départements',
						options?.departments,
					)}
				/>
				<SelectField
					label="Famille d'honneurs"
					field={fields.honorFamilyId}
					defaultValue={defaultValues?.honorFamilyId}
					placeholder="Sélectionner une famille d'honneurs"
					items={formatSelectOptions(
						'Toutes les familles',
						options?.honorFamilies,
					)}
				/>
				<SelectField
					label="Tribus"
					field={fields.tribeId}
					defaultValue={defaultValues?.tribeId}
					placeholder="Sélectionner une tribu"
					items={formatSelectOptions('Toutes les tribus', options?.tribes)}
				/>
				<SelectField
					label="Statut"
					field={fields.status}
					defaultValue={defaultValues?.status}
					placeholder="Sélectionner un statut"
					items={statusFilterData}
				/>
				{/* <SelectField
					label="Etats"
					field={fields.state}
					defaultValue={defaultValues?.state}
					placeholder="Sélectionner un état"
					items={stateFilterData}
				/> */}
			</div>
			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					variant="primary"
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Filtrer
				</Button>
			</div>
		</fetcher.Form>
	)
}
