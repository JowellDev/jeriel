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
import { z } from 'zod'
import { cn } from '~/utils/ui'
import { paramsSchema } from '../schema'
import { useMediaQuery } from 'usehooks-ts'
import { useFetcher } from '@remix-run/react'
import { LoaderData } from '../loader.server'
import { MemberFilterOptions } from '../types'
import { RiFilterLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import { MOBILE_WIDTH } from '~/shared/constants'
import { ComponentProps, useEffect, useState } from 'react'
import { SelectInput } from '~/components/form/select-input'
import { DateRangePicker } from '~/components/form/date-picker'
import { stateFilterData, statusFilterData } from '../constants'

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
	const fetcher = useFetcher<LoaderData>({ key: 'fetch-honor-family-members' })
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
	fetcher: ReturnType<typeof useFetcher<LoaderData>>
	reloadData: (data: MemberFilterOptions) => void
}) {
	const [status, setStatus] = useState('')
	const [state, setState] = useState('')
	const [dateRange, setDateRange] = useState<DateRange>({
		from: filterData.from,
		to: filterData.to,
	})

	const handleDateRangeChange = (value: DateRange) => {
		setDateRange(value)
	}

	const handleStatsChange = (value: string) => {
		setState(value)
	}

	const handleStatusChange = (value: string) => {
		setStatus(value)
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			onClose?.()
		}
	}, [fetcher.state, fetcher.data])

	return (
		<fetcher.Form
			onSubmit={ev => {
				reloadData({ ...filterData, ...dateRange, state, status })
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
