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
import { paramsSchema } from '../schema'
import { MOBILE_WIDTH } from '~/shared/constants'
import { Form, useFetcher, useSearchParams } from '@remix-run/react'
import { stateFilterData, statusFilterData } from '../constants'
import { ComponentProps, useEffect, useState } from 'react'
import { DateRangePicker } from '~/components/form/date-picker'
import { SelectInput } from '~/components/form/select-input'
import { type ActionType } from '../action.server'
import { MemberFilterOptions } from '../types'
import { z } from 'zod'

type FilterData = z.infer<typeof paramsSchema>
type DateRange = { from: string | undefined; to?: string | undefined }
interface Props {
	onClose: () => void
	filterData: FilterData
	reloadData: (data: MemberFilterOptions) => void
}

export function FilterFormDialog({
	onClose,
	filterData,
	reloadData,
}: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Filtres'

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
						onClose={onClose}
						filterData={filterData}
						reloadData={reloadData}
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
					filterData={filterData}
					reloadData={reloadData}
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
	reloadData,
}: ComponentProps<'form'> & {
	isLoading: boolean
	filterData: FilterData
	onClose?: () => void
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	reloadData: (data: MemberFilterOptions) => void
}) {
	const [status, setStatus] = useState('')
	const [state, setState] = useState('')
	const [dateRange, setDateRange] = useState<DateRange>({
		from: filterData.from,
		to: filterData.to,
	})

	const handleDateRangeChange = (value: DateRange) => {
		console.log({ value })
		setDateRange(value)
	}

	const handleStatsChange = (value: string) => {
		console.log(value)
		setState(value)
	}

	const handleStatusChange = (value: string) => {
		console.log(value)
		setStatus(value)
	}

	function handleSubmit() {
		console.log(state, status)
		reloadData({ ...filterData, ...dateRange, state, status })
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			console.log('Loading data : ', fetcher.data)
			onClose?.()
		}
	}, [fetcher.state, fetcher.data])

	return (
		<Form
			onSubmit={ev => {
				ev.preventDefault()
				ev.stopPropagation()
			}}
			className={cn('grid items-start gap-4', className)}
		>
			<div className="flex space-x-3">
				<DateRangePicker
					defaultValue={{ from: filterData?.from, to: filterData?.to }}
					onValueChange={dateRange =>
						handleDateRangeChange({
							from: dateRange?.from?.toISOString(),
							to: dateRange?.to?.toISOString(),
						})
					}
					className="min-w-[16rem]"
				/>
				<SelectInput
					placeholder="Etat"
					defaultValue={filterData.state}
					items={stateFilterData}
					onChange={value => handleStatsChange(value)}
				/>
				<SelectInput
					placeholder="Statut"
					defaultValue={filterData.status}
					items={statusFilterData}
					onChange={value => handleStatusChange(value)}
				/>
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					variant="gold"
					disabled={isLoading}
					className="w-full sm:w-auto"
					onClick={handleSubmit}
				>
					Appliquer le filtre
				</Button>
			</div>
		</Form>
	)
}
