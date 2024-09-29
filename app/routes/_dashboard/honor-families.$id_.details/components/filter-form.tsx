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
import { paramsSchema } from '../schema'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { FORM_INTENT, stateFilterData, statusFilterData } from '../constants'
import { type ActionType } from '../action.server'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { DateRangePicker } from '~/components/form/date-picker'
import { DateRange } from 'react-day-picker'
import { SelectInput } from '~/components/form/select-input'

interface Props {
	onClose: () => void
	filterData?: z.infer<typeof paramsSchema>
}

export function FilterFormDialog({ onClose, filterData }: Readonly<Props>) {
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
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
	filterData?: z.infer<typeof paramsSchema>
}) {
	const [status, setStatus] = useState('')
	const [state, setState] = useState('')

	const schema = paramsSchema

	const [form, fields] = useForm({
		constraint: getZodConstraint(schema),
		id: 'create-member-form',
		shouldRevalidate: 'onBlur',
		lastResult: fetcher.data?.lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		defaultValue: filterData
			? {
					state: filterData.state,
					status: filterData.status,
					from: filterData.from,
					to: filterData.to,
				}
			: null,
	})

	const handleDateRangeChange = (value?: DateRange) => {}

	// const handleFilterChange = (
	// 	filterType: 'state' | 'status',
	// 	value: string,
	// ) => {
	// 	setFilters(prev => ({ ...prev, [filterType]: value }))
	// 	const newFilterData = {
	// 		...filterData,
	// 		[filterType]: value,
	// 		page: 1,
	// 	}
	// }

	const handleStatsChange = (value: string) => {
		setState(value)
	}

	const handleStatusChange = (value: string) => {
		setStatus(value)
	}

	const reloadData = () => {
		console.log('reloading data ...')
	}

	useEffect(() => {
		if (fetcher.data?.success) {
			onClose?.()
		}
	}, [fetcher.data, onClose])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			onSubmit={ev => {
				ev.preventDefault()
				ev.stopPropagation()
				reloadData()
			}}
			className={cn('grid items-start gap-4', className)}
		>
			<div className="flex space-x-3">
				<DateRangePicker
					defaultValue={{ from: filterData?.from, to: filterData?.to }}
					onValueChange={handleDateRangeChange}
					className="min-w-[16rem]"
				/>
				<SelectInput
					placeholder="Etat"
					items={stateFilterData}
					onChange={value => handleStatsChange(value)}
				/>
				<SelectInput
					placeholder="Statut"
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
				>
					Appliquer le filtre
				</Button>
			</div>
		</fetcher.Form>
	)
}
