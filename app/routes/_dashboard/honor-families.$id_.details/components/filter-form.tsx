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
import { z } from 'zod'
import { cn } from '~/utils/ui'
import { filterSchema, paramsSchema } from '../schema'
import { useMediaQuery } from 'usehooks-ts'
import { useFetcher } from '@remix-run/react'
import { LoaderData } from '../loader.server'
import { MemberFilterOptions } from '../types'
import { RiFilterLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import { MOBILE_WIDTH } from '~/shared/constants'
import { ComponentProps, useEffect, useState } from 'react'
import { DateRangePicker } from '~/components/form/date-picker'
import { stateFilterData, statusFilterData } from '../constants'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { SelectField } from '~/components/form/select-field'
import InputField from '~/components/form/input-field'

type FilterData = z.infer<typeof paramsSchema>
type DateRange = { from: string | undefined; to?: string | undefined }
interface Props {
	onClose: (shouldReload?: boolean) => void
	filterData: FilterData
	onFilter: (options: { state?: string; status?: string }) => void
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
}: MainFormProps) {
	const [dateRange, setDateRange] = useState<DateRange>({
		from: filterData.from,
		to: filterData.to,
	})

	const schema = filterSchema

	const handleDateRangeChange = (value: DateRange) => {
		setDateRange(value)
		form.update({ name: 'from', value: value.from })
		form.update({ name: 'to', value: value.to })
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
				onClose(false)
			}
		},
	})

	useEffect(() => {
		if (fetcher?.data) {
			onClose(false)
		}
	}, [fetcher.data, onClose])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			action="."
			className={cn('grid items-start gap-4 px-4')}
		>
			<div className="">
				<DateRangePicker
					defaultValue={{ from: dateRange.from, to: dateRange.to }}
					onValueChange={dateRange =>
						handleDateRangeChange({
							from: dateRange?.from?.toISOString(),
							to: dateRange?.to?.toISOString(),
						})
					}
					className="w-full py-6"
				/>
				<InputField field={fields.from} InputProps={{ hidden: true }} />
				<InputField field={fields.to} InputProps={{ hidden: true }} />
				<SelectField
					placeholder="Etat"
					defaultValue={filterData.state}
					items={stateFilterData}
					field={fields.state}
				/>
				<SelectField
					placeholder="Statut"
					defaultValue={filterData.status}
					items={statusFilterData}
					field={fields.status}
				/>
			</div>

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
					variant="gold"
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Appliquer le filtre
					<RiFilterLine size={20} />
				</Button>
			</div>
		</fetcher.Form>
	)
}
