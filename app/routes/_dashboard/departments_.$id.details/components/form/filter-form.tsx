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
import { filterSchema } from '../../schema'
import { SelectField } from '~/components/form/select-field'
import { statusFilterData } from '../../constants'
import { useState } from 'react'
import MonthPicker from '~/components/form/month-picker'
import type { DateRange } from 'react-day-picker'
import { startOfMonth } from 'date-fns'
import InputField from '~/components/form/input-field'

interface Props {
	onClose: () => void
	onFilter: (options: { state?: string; status?: string }) => void
}

export function FilterForm({ onClose, onFilter }: Readonly<Props>) {
	const fetcher = useFetcher<any>()
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
						isLoading={isLoading}
						onFilter={onFilter}
						fetcher={fetcher}
						onClose={onClose}
						showCloseBtn
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
					isLoading={isLoading}
					onFilter={onFilter}
					fetcher={fetcher}
					className="px-4"
					onClose={onClose}
					showCloseBtn={false}
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
	onFilter,
	showCloseBtn,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<any>>
	onClose: () => void
	showCloseBtn: boolean
	onFilter: (options: { state?: string; status?: string }) => void
}) {
	const schema = filterSchema
	const [currentMonth, setCurrentMonth] = useState(new Date())

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

	const handlePeriodChange = ({ from, to }: DateRange) => {
		if (from && to) setCurrentMonth(new Date(startOfMonth(to)))

		form.update({ name: 'from', value: from })
		form.update({ name: 'to', value: to })
	}

	return (
		<fetcher.Form
			{...getFormProps(form)}
			action="."
			className={cn('grid items-start gap-4', className)}
		>
			<MonthPicker
				defaultMonth={new Date(currentMonth)}
				onChange={handlePeriodChange}
				className="h-[3rem] w-full"
			/>
			<SelectField
				items={statusFilterData}
				field={fields.status}
				label="Statut"
				placeholder="Sélectionner un statut"
			/>

			{/* <SelectField
				items={stateFilterData}
				field={fields.state}
				label="Etats"
				placeholder="Sélectionner un état"
			/> */}

			<InputField field={fields.from} inputProps={{ hidden: true }} />
			<InputField field={fields.to} inputProps={{ hidden: true }} />

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{showCloseBtn && onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
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
