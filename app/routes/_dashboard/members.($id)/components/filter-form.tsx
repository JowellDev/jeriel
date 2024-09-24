import { useFetcher } from '@remix-run/react'
import type { DateRange } from 'react-day-picker'
import { SelectInput } from '~/components/form/select-input'
import { type MemberFilterOptionsApiData } from '~/api/get-members-filter-select-options/_index'
import { useEffect, useState } from 'react'
import { type SelectOption } from '~/shared/types'
import { MOBILE_WIDTH, SELECT_ALL_OPTION } from '~/shared/constants'
import { MonthPicker } from '~/components/form/month-picker'
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

interface Options {
	departments: SelectOption[]
	honorFamilies: SelectOption[]
	tribes: SelectOption[]
	states: SelectOption[]
	status: SelectOption[]
}

type FilterOptions = Record<string, string | undefined>

interface FilterFormDialogProps {
	onClose: () => void
	onFilter: (options: FilterOptions) => void
	onMonthChange: (value: DateRange) => void
}

interface FilterFormProps {
	onClose: () => void
	onFilter: (options: FilterOptions) => void
	onMonthChange: (value: DateRange) => void
}

export default function FilterFormDialog(props: FilterFormDialogProps) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={props.onClose}>
				<DialogContent
					className="md:max-w-xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>Filtre des fidèles</DialogTitle>
					</DialogHeader>
					<FilterForm
						onClose={props.onClose}
						onFilter={props.onFilter}
						onMonthChange={props.onMonthChange}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={props.onClose}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>Filtre des fidèles</DrawerTitle>
				</DrawerHeader>
				<FilterForm
					onClose={props.onClose}
					onFilter={props.onFilter}
					onMonthChange={props.onMonthChange}
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

function FilterForm({ onFilter, onMonthChange }: Readonly<FilterFormProps>) {
	const { load, ...fetcher } = useFetcher<MemberFilterOptionsApiData>()
	const [options, setOptions] = useState<Options>({
		honorFamilies: [],
		departments: [],
		tribes: [],
		states: [],
		status: [],
	})

	useEffect(() => {
		load('/api/get-members-filter-select-options')
	}, [load])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data) {
			setOptions(fetcher.data)
		}
	}, [fetcher.data, fetcher.state])

	return (
		<div className="grid gap-4">
			<MonthPicker onChange={onMonthChange} />
			<SelectInput
				placeholder="Départements"
				items={[
					{ ...SELECT_ALL_OPTION, label: 'Tous les départements' },
					...options.departments,
				]}
				onChange={(value: string) => onFilter({ departmentId: value })}
			/>
			<SelectInput
				placeholder="Famille d'honneurs"
				items={[
					{ ...SELECT_ALL_OPTION, label: 'Tous les familles' },
					...options.honorFamilies,
				]}
				onChange={(value: string) => onFilter({ honorFamilyId: value })}
			/>
			<SelectInput
				placeholder="Tribus"
				items={[
					{ ...SELECT_ALL_OPTION, label: 'Toutes les tribus' },
					...options.tribes,
				]}
				onChange={(value: string) => onFilter({ tribeId: value })}
			/>
			<SelectInput
				placeholder="Status"
				items={[
					{ ...SELECT_ALL_OPTION, label: 'Tous les statuts' },
					...options.status,
				]}
				onChange={(value: string) => onFilter({ status: value })}
			/>
			<SelectInput
				placeholder="Etat"
				items={[
					{ ...SELECT_ALL_OPTION, label: 'Tous les états' },
					...options.states,
				]}
				onChange={(value: string) => onFilter({ state: value })}
			/>
		</div>
	)
}
