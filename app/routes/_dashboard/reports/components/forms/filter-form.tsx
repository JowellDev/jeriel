import { useFetcher } from '@remix-run/react'
import { type MemberFilterOptionsApiData } from '~/routes/api/get-members-select-options/_index'
import { useEffect, useState } from 'react'
import { type SelectOption } from '~/shared/types'
import { MOBILE_WIDTH } from '~/shared/constants'
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
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { filterSchema, type MemberFilterOptions } from '../../schema'
import { cn } from '~/utils/ui'
import { SelectField } from '~/components/form/select-field'
import { type DateRange } from 'react-day-picker'
import { startOfMonth } from 'date-fns'
import MonthPicker from '~/components/form/month-picker'
import InputField from '~/components/form/input-field'
import type { EntityType } from '../../model'

interface Options {
	departments: SelectOption[]
	honorFamilies: SelectOption[]
	tribes: SelectOption[]
}

interface FilterFormDialogProps {
	defaultValues: MemberFilterOptions
	onClose: () => void
	onSubmit: (payload: MemberFilterOptions) => void
}

interface FilterFormProps {
	options: Options
	defaultValues: MemberFilterOptions
	className?: string
	onSubmit: (payload: MemberFilterOptions) => void
	onClose?: () => void
}

export default function FilterFormDialog(
	props: Readonly<FilterFormDialogProps>,
) {
	const { load, ...apiFetcher } = useFetcher<MemberFilterOptionsApiData>()
	const [options, setOptions] = useState<Options>({
		honorFamilies: [],
		departments: [],
		tribes: [],
	})

	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	const title = 'Filtre'

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
					<FilterForm
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
				<FilterForm
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

function FilterForm({
	options,
	defaultValues,
	className,
	onSubmit,
	onClose,
}: Readonly<FilterFormProps>) {
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
	const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(
		defaultValues.entityType ?? null,
	)
	const [currentMonth, setCurrentMonth] = useState(new Date())

	const handlePeriodChange = ({ from, to }: DateRange) => {
		if (from && to) setCurrentMonth(new Date(startOfMonth(to)))

		form.update({ name: 'from', value: from })
		form.update({ name: 'to', value: to })
	}

	function formatSelectOptions(allLabel: string, options?: SelectOption[]) {
		return [{ value: 'ALL', label: allLabel }, ...(options ?? [])]
	}

	const entityOptions = [
		{ value: 'ALL', label: 'Toutes les entités' },
		{ value: 'TRIBE', label: 'Tribus' },
		{ value: 'DEPARTMENT', label: 'Départements' },
		{ value: 'HONOR_FAMILY', label: "Familles d'honneurs" },
	]

	const handleEntityChange = (value: string) => {
		setSelectedEntity(value as EntityType)
		form.update({ name: 'tribeId', value: 'ALL' })
		form.update({ name: 'departmentId', value: 'ALL' })
		form.update({ name: 'honorFamilyId', value: 'ALL' })
	}

	return (
		<fetcher.Form
			{...getFormProps(form)}
			className={cn('grid items-start gap-4 mt-4', className)}
		>
			<div className="grid gap-4">
				<MonthPicker
					label="Période"
					defaultMonth={new Date(defaultValues.to ?? currentMonth)}
					onChange={handlePeriodChange}
					className="h-[3rem] w-full"
				/>

				<SelectField
					label="Type d'entité"
					field={fields.entityType}
					placeholder="Sélectionner un type d'entité"
					items={entityOptions}
					onChange={handleEntityChange}
					defaultValue={defaultValues.entityType}
				/>
				{selectedEntity === 'DEPARTMENT' && (
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
				)}

				{selectedEntity === 'TRIBE' && (
					<SelectField
						label="Tribus"
						field={fields.tribeId}
						defaultValue={defaultValues?.tribeId}
						placeholder="Sélectionner une tribu"
						items={formatSelectOptions('Toutes les tribus', options?.tribes)}
					/>
				)}

				{selectedEntity === 'HONOR_FAMILY' && (
					<SelectField
						label="Familles d'honneur"
						field={fields.honorFamilyId}
						defaultValue={defaultValues?.honorFamilyId}
						placeholder="Sélectionner une famille d'honneurs"
						items={formatSelectOptions(
							'Toutes les familles',
							options?.honorFamilies,
						)}
					/>
				)}

				<InputField field={fields.from} InputProps={{ hidden: true }} />
				<InputField field={fields.to} InputProps={{ hidden: true }} />
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
