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
import { paramsSchema as filterSchema, type paramsSchema } from '../../schema'
import { SelectField } from '~/components/form/select-field'
import { stateFilterData, statusFilterData } from '../../constants'
import { useEffect, useState } from 'react'
import DateSelector from '~/components/form/date-selector'
import { type DateRange } from 'react-day-picker'
import { type z } from 'zod'
import { startOfMonth } from 'date-fns'
import InputField from '~/components/form/input-field'

type FilterData = z.infer<typeof paramsSchema>
interface Props {
	onClose: () => void
	filterData: FilterData
	onFilter: (options: { state?: string; status?: string }) => void
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
	filterData: FilterData
	onFilter: (options: { state?: string; status?: string }) => void
}) {
	const schema = filterSchema
	const [currentMonth, setCurrentMonth] = useState(new Date())

	const handleDateRangeChange = ({ from, to }: DateRange) => {
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
		if (fetcher.data?.success) {
			onClose?.()
		}
	}, [fetcher.data, onClose])

	useEffect(() => {
		handleDateRangeChange({
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
			<DateSelector
				defaultMonth={new Date(filterData.from ?? currentMonth)}
				onChange={handleDateRangeChange}
			/>

			<>
				<InputField field={fields.from} InputProps={{ hidden: true }} />
				<InputField field={fields.to} InputProps={{ hidden: true }} />
			</>

			<SelectField
				label="Statuts"
				items={statusFilterData}
				field={fields.status}
				placeholder="Statuts"
			/>

			<SelectField
				label="Etats"
				items={stateFilterData}
				field={fields.state}
				placeholder="Etats"
				defaultValue={filterData.state}
			/>

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
