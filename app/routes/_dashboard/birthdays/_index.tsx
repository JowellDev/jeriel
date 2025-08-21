import { type MetaFunction } from '@remix-run/node'
import { DateRangePicker } from '~/components/form/date-range-picker'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { BirthdayTable } from './components/birthdays-table'
import { loaderFn, type LoaderType } from './loader.server'
import { useLoaderData } from '@remix-run/react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { useCallback, useState } from 'react'
import { type DateRange } from 'react-day-picker'

export const meta: MetaFunction = () => [{ title: 'Gestion des anniversaires' }]
export const loader = loaderFn

export default function Birthday() {
	const { birthdays } = useLoaderData<LoaderType>()
	const [from, setFrom] = useState<Date | undefined>(undefined)
	const [to, setTo] = useState<Date | undefined>(undefined)

	const handleDateRangeChange = useCallback(
		(dateRange: DateRange | undefined) => {
			setFrom(dateRange?.from)
			setTo(dateRange?.to)
		},
		[],
	)

	const handleResetDateRange = useCallback(() => {
		handleDateRangeChange({ from: undefined, to: undefined })
	}, [handleDateRangeChange])

	return (
		<MainContent
			headerChildren={
				<Header title="Anniversaires">
					<div className="flex space-x-2">
						<div className="hidden sm:block">
							<DateRangePicker
								defaultLabel="Sélectionner une période"
								onResetDate={handleResetDateRange}
								defaultValue={undefined}
								onValueChange={dateRange => handleDateRangeChange(dateRange)}
							/>
						</div>
						<Button
							className="hidden sm:block"
							variant={'primary'}
							disabled={!(from && to)}
						>
							Filtrer
						</Button>
					</div>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="sm:hidden flex space-x-2">
					<DateRangePicker
						defaultLabel="Sélectionner une période"
						onResetDate={handleResetDateRange}
						defaultValue={undefined}
						onValueChange={dateRange => handleDateRangeChange(dateRange)}
						className="w-full"
					/>
					<Button variant={'primary'} disabled={!(from && to)}>
						Filtrer
					</Button>
				</div>
				<Card className="space-y-2 pb-4 mb-2">
					<BirthdayTable data={birthdays} />
				</Card>
			</div>
		</MainContent>
	)
}
