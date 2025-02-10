import { getMonthSundays } from '~/utils/date'
import { sub } from 'date-fns'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { type ViewOption } from '~/components/toolbar'
import { MemberTable } from './member-table'
import { getCultColumns } from './cult-columns'
import { getServiceColumns } from './service-columns'

interface RenderTableProps {
	view: ViewOption
	data: MemberMonthlyAttendances[]
	currentMonth: Date
}

export const renderTable = ({
	data,
	view,
	currentMonth,
}: Readonly<RenderTableProps>) => {
	const lastMonth = sub(currentMonth, { months: 1 })
	const currentMonthSundays = getMonthSundays(currentMonth)

	const tableProps = {
		data,
		currentMonthSundays,
		lastMonth,
	}

	switch (view) {
		case 'CULTE':
			return (
				<MemberTable
					{...tableProps}
					getColumns={() => getCultColumns(currentMonthSundays, lastMonth)}
				/>
			)
		case 'SERVICE':
			return (
				<MemberTable
					{...tableProps}
					getColumns={() => getServiceColumns(currentMonthSundays, lastMonth)}
				/>
			)

		default:
			return null
	}
}
