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
import type { z } from 'zod'
import { cn } from '~/utils/ui'
import type { paramsSchema } from '../schema'
import { filterSchema } from '../schema'
import { useMediaQuery } from 'usehooks-ts'
import { useFetcher } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useEffect, useState } from 'react'
import { type DateRange } from 'react-day-picker'
import type { STATUS } from '../constants'
import { stateFilterData, statusFilterData } from '../constants'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { SelectField } from '~/components/form/select-field'
import InputField from '~/components/form/input-field'
import DateSelector from '~/components/form/date-selector'
import { startOfMonth } from 'date-fns'

type FilterData = z.infer<typeof paramsSchema>
interface Props {
	onClose: (shouldReload?: boolean) => void
	filterData: FilterData
	onFilter: (options: { state?: string; status?: STATUS }) => void
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

	const title = 'Liste de presence'

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
		if (fetcher?.data) {
			onClose(false)
		}
	}, [fetcher.data, onClose])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			action="."
			className={cn('grid items-start gap-4')}
		>
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
