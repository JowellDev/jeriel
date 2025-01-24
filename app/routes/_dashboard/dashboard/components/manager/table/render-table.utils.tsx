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
}

const lastMonth = sub(new Date(), { months: 1 })
const currentMonthSundays = getMonthSundays(new Date())

export const renderTable = ({ data, view }: Readonly<RenderTableProps>) => {
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
					getColumns={() => getCultColumns(currentMonthSundays)}
				/>
			)
		case 'SERVICE':
			return (
				<MemberTable
					{...tableProps}
					getColumns={() => getServiceColumns(currentMonthSundays)}
				/>
			)

		default:
			return null
	}
}
