import { useEffect, useState } from 'react'
import { useFetcher } from '@remix-run/react'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { startOfMonth } from 'date-fns'
import { type DateRange } from 'react-day-picker'
import { useMediaQuery } from 'usehooks-ts'
import type { z } from 'zod'

import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import InputField from '~/components/form/input-field'
import MonthPicker from '~/components/form/month-picker'
import { SelectField } from '~/components/form/select-field'
import { MOBILE_WIDTH } from '~/shared/constants'
import { cn } from '~/utils/ui'

import type { STATUS } from '../../constants'
import { stateFilterData, statusFilterData } from '../../constants'
import type { paramsSchema } from '../../schema'
import { filterSchema } from '../../schema'

type FilterData = z.infer<typeof paramsSchema>
interface Props {
	onClose: (shouldReload?: boolean) => void
	filterData: FilterData
	onFilter: (options: {
		state?: string
		status?: STATUS
		from: string
		to: string
	}) => void
}
interface MainFormProps extends Props {
	isLoading: boolean
	filterData: FilterData
	fetcher: ReturnType<typeof useFetcher<any>>
}

export function FilterFormDialog({
	onClose,
	filterData,
	onFilter,
}: Readonly<Props>) {
	const fetcher = useFetcher()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Filtres'

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={() => onClose(false)}>
				<DialogContent
					className="md:max-w-3xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription></DialogDescription>
					</DialogHeader>
					<MainForm
						isLoading={isSubmitting}
						fetcher={fetcher}
						filterData={filterData}
						onClose={onClose}
						onFilter={onFilter}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={() => onClose(false)}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
				</DrawerHeader>
				<MainForm
					isLoading={isSubmitting}
					fetcher={fetcher}
					filterData={filterData}
					onClose={onClose}
					onFilter={onFilter}
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
	isLoading,
	fetcher,
	onClose,
	filterData,
	onFilter,
}: Readonly<MainFormProps>) {
	const schema = filterSchema

	const [isDateReseted, setIsDateReseted] = useState(false)
	const [currentMonth, setCurrentMonth] = useState(new Date())

	const handlePeriodChange = ({ from, to }: DateRange) => {
		if (from && to) {
			setIsDateReseted(false)
			setCurrentMonth(new Date(startOfMonth(to)))
		}

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
			className={cn('grid items-start gap-4')}
		>
			<MonthPicker
				label="Période"
				defaultMonth={new Date(filterData.from ?? currentMonth)}
				onChange={handlePeriodChange}
				className="h-[3rem] w-full"
			/>
			{!isDateReseted && (
				<>
					<InputField field={fields.from} inputProps={{ hidden: true }} />
					<InputField field={fields.to} inputProps={{ hidden: true }} />
				</>
			)}

			<SelectField
				label="Statut"
				placeholder="Sélectionner un statut"
				defaultValue={filterData.status}
				items={statusFilterData}
				field={fields.status}
			/>
			<SelectField
				label="Etats"
				placeholder="Sélectionner un état"
				defaultValue={filterData.state}
				items={stateFilterData}
				field={fields.state}
			/>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button
						type="button"
						variant="outline"
						onClick={() => onClose(false)}
						className="sm:flex hidden"
					>
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
