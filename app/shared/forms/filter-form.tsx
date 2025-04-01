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
import { useFetcher } from '@remix-run/react'
import { filterSchema } from '../schema'
import { SelectField } from '~/components/form/select-field'
import { MOBILE_WIDTH, statusFilterData } from '../constants'
import { useEffect, useState } from 'react'
import MonthPicker from '~/components/form/month-picker'
import { type DateRange } from 'react-day-picker'
import { startOfMonth } from 'date-fns'
import InputField from '~/components/form/input-field'
import type { MemberFilterOptions } from '../types'

interface Props {
	onClose: () => void
	filterData: MemberFilterOptions
	onFilter: (options: MemberFilterOptions) => void
}

export function FilterForm({ onClose, onFilter, filterData }: Readonly<Props>) {
	const fetcher = useFetcher()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isLoading = ['loading'].includes(fetcher.state)

	const title = 'Filtre'

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
					aria-describedby=""
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						filterData={filterData}
						isLoading={isLoading}
						onFilter={onFilter}
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
					filterData={filterData}
					isLoading={isLoading}
					onClose={onClose}
					onFilter={onFilter}
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

function MainForm({
	className,
	isLoading,
	fetcher,
	onClose,
	filterData,
	onFilter,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<any>>
	onClose: () => void
	filterData: MemberFilterOptions
	onFilter: (options: MemberFilterOptions) => void
}) {
	const schema = filterSchema
	const [currentMonth, setCurrentMonth] = useState(new Date())

	const handlePeriodChange = ({ from, to }: DateRange) => {
		if (from && to) setCurrentMonth(new Date(startOfMonth(to)))

		form.update({ name: 'from', value: from })
		form.update({ name: 'to', value: to })
	}

	const [form, fields] = useForm({
		constraint: getZodConstraint(schema),
		lastResult: fetcher.data?.lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		id: 'filter-form',
		shouldRevalidate: 'onBlur',
		onSubmit(event, context) {
			event.preventDefault()

			const submission = context.submission

			if (submission?.status === 'success') {
				const value = submission.value
				onFilter(value)
			}
		},
	})

	useEffect(() => {
		handlePeriodChange({
			from: new Date(filterData?.from ?? currentMonth),
			to: new Date(filterData?.to ?? currentMonth),
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			action="."
			className={cn('grid items-start gap-4', className)}
		>
			<MonthPicker
				label="Période"
				defaultMonth={new Date(filterData.from ?? currentMonth)}
				onChange={handlePeriodChange}
				className="h-[3rem] w-full"
			/>

			<SelectField
				label="Statut"
				placeholder="Sélectionner un statut"
				items={statusFilterData}
				field={fields.status}
			/>

			{/* <SelectField
				label="Etats"
				placeholder="Sélectionner un état"
				items={stateFilterData}
				field={fields.state}
				defaultValue={filterData.state}
			/> */}

			<InputField field={fields.from} InputProps={{ hidden: true }} />
			<InputField field={fields.to} InputProps={{ hidden: true }} />

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						className="sm:flex hidden"
					>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					name="intent"
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
