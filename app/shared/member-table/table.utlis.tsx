import { getMonthSundays } from '~/utils/date'
import { sub } from 'date-fns'
import { getCultColumns } from './columns/cult/cult-columns'
import { getServiceColumns } from './columns/service/service-colums'
import { getStatCultColumns } from './columns/cult/stat-cult-colums'
import { getStatServiceColumns } from './columns/service/stat-service-colums'
import { MemberTable } from './member-table'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { type ViewOption } from '~/components/toolbar'
import { getMeetingColumns } from './columns/meeting/meeting-colums'
import { getStatMeetingColumns } from './columns/meeting/stat-meeting-colums'

interface RenderTableProps {
	view: ViewOption
	statView?: ViewOption | null
	data: MemberMonthlyAttendances[]
	currentMonth?: Date
}

export const renderTable = ({
	data,
	view,
	statView,
	currentMonth,
}: Readonly<RenderTableProps>) => {
	const date = currentMonth || new Date()
	const lastMonth = sub(date, { months: 1 })
	const currentMonthSundays = getMonthSundays(date)

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
		case 'MEETING':
			return (
				<MemberTable
					{...tableProps}
					getColumns={() => getMeetingColumns(currentMonthSundays, lastMonth)}
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
			} else if (statView === 'MEETING') {
				return (
					<MemberTable
						{...tableProps}
						getColumns={() => getStatMeetingColumns(currentMonthSundays)}
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
