import { getMonthSundays } from '~/utils/date'
import { sub } from 'date-fns'
import { getCultColumns } from '../components/cult/columns'
import { getMeetingColumns } from '../components/meeting/colums'
import { getStatCultColumns } from '../components/statistics/stat-cult-colums'
import { getStatMeetingColumns } from '../components/statistics/stat-meeting-colums'
import { TribeMemberTable } from '../components/tribe-member-table'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { Views } from '../types'

interface RenderTableProps {
	view: (typeof Views)[keyof typeof Views]
	statView: (typeof Views)[keyof typeof Views]
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
		case Views.CULTE:
			return (
				<TribeMemberTable
					{...tableProps}
					getColumns={() => getCultColumns(currentMonthSundays, lastMonth)}
				/>
			)
		case Views.SERVICE:
			return (
				<TribeMemberTable
					{...tableProps}
					getColumns={() => getMeetingColumns(currentMonthSundays, lastMonth)}
				/>
			)
		case Views.STAT:
			return statView === Views.CULTE ? (
				<TribeMemberTable
					{...tableProps}
					getColumns={() => getStatCultColumns(currentMonthSundays)}
				/>
			) : (
				<TribeMemberTable
					{...tableProps}
					getColumns={() => getStatMeetingColumns(currentMonthSundays)}
				/>
			)
		default:
			return null
	}
}
