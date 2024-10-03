import { getMonthSundays } from '~/utils/date'
import { sub } from 'date-fns'
import { getCultColumns } from '../components/cult/columns'
import { getMeetingColumns } from '../components/meeting/colums'
import { getStatCultColumns } from '../components/statistics/stat-cult-colums'
import { getStatMeetingColumns } from '../components/statistics/stat-meeting-colums'
import { TribeMemberTable } from '../components/tribe-member-table'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { type ViewOption } from '~/components/toolbar'

interface RenderTableProps {
	view: ViewOption
	statView: ViewOption
	data: MemberMonthlyAttendances[]
}

const lastMonth = sub(new Date(), { months: 1 })
const currentMonthSundays = getMonthSundays(new Date())

export const renderTable = ({
	data,
	view,
	statView,
}: Readonly<RenderTableProps>) => {
	const tableProps = {
		data,
		currentMonthSundays,
		lastMonth,
	}

	switch (view) {
		case 'CULTE':
			return (
				<TribeMemberTable
					{...tableProps}
					getColumns={() => getCultColumns(currentMonthSundays, lastMonth)}
				/>
			)
		case 'SERVICE':
			return (
				<TribeMemberTable
					{...tableProps}
					getColumns={() => getMeetingColumns(currentMonthSundays, lastMonth)}
				/>
			)
		case 'STAT':
			if (statView === 'CULTE') {
				return (
					<TribeMemberTable
						{...tableProps}
						getColumns={() => getStatCultColumns(currentMonthSundays)}
					/>
				)
			} else {
				return (
					<TribeMemberTable
						{...tableProps}
						getColumns={() => getStatMeetingColumns(currentMonthSundays)}
					/>
				)
			}
		default:
			return null
	}
}
