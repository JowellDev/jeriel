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
import { filterSchema } from '../schema'
import { cn } from '~/utils/ui'
import { SelectField } from '~/components/form/select-field'
import { type MemberFilterOptions } from '../types'
import { stateFilterData, statusFilterData } from '~/shared/filter'

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
					field={fields.departmentId}
					defaultValue={defaultValues?.departmentId}
					placeholder="Départements"
					items={formatSelectOptions(
						'Tous les départements',
						options?.departments,
					)}
				/>
				<SelectField
					field={fields.honorFamilyId}
					defaultValue={defaultValues?.honorFamilyId}
					placeholder="Famille d'honneurs"
					items={formatSelectOptions(
						'Toutes les familles',
						options?.honorFamilies,
					)}
				/>
				<SelectField
					field={fields.tribeId}
					defaultValue={defaultValues?.tribeId}
					placeholder="Tribus"
					items={formatSelectOptions('Toutes les tribus', options?.tribes)}
				/>
				<SelectField
					field={fields.status}
					defaultValue={defaultValues?.status}
					placeholder="Statuts"
					items={statusFilterData}
				/>
				<SelectField
					field={fields.state}
					defaultValue={defaultValues?.state}
					placeholder="Etats"
					items={stateFilterData}
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
