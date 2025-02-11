import { getMonthSundays } from '~/utils/date'
import { sub } from 'date-fns'
import { getCultColumns } from './columns/cult/cult-columns'
import { getServiceColumns } from './columns/service/service-colums'
import { getStatCultColumns } from './columns/cult/stat-cult-colums'
import { getStatServiceColumns } from './columns/service/stat-service-colums'
import { MemberTable } from './member-table'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { type ViewOption } from '~/components/toolbar'

interface RenderTableProps {
	view: ViewOption
	statView: ViewOption
	data: MemberMonthlyAttendances[]
	currentMonth: Date
}

export const renderTable = ({
	data,
	view,
	statView,
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
		case 'STAT':
			if (statView === 'CULTE') {
				return (
					<MemberTable
						{...tableProps}
						getColumns={() => getStatCultColumns(currentMonthSundays)}
					/>
				)
			} else {
				return (
					<MemberTable
						{...tableProps}
						getColumns={() => getStatServiceColumns(currentMonthSundays)}
					/>
				)
			}
		default:
			return null
	}
}
