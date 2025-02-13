import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { loaderFn } from './loader.server'
import HeaderContent from './components/header-content'
import { useLoaderData } from '@remix-run/react'
import { type MemberWithRelations } from '~/models/member.model'
import GlobalStats from './components/global-stats'
import MemberFormDialog from '../members.($id)/components/member-form-dialog'
import { useState } from 'react'
import { getMemberAttendanceData } from './utils/member-data'

export const loader = loaderFn

export default function MemberDetails() {
	const { member } = useLoaderData<typeof loader>()
	const [openEditForm, setOpenEditForm] = useState(false)

	function handleOnClose() {
		setOpenEditForm(false)
	}

	const attendanceData = getMemberAttendanceData(member)

	return (
		<MainContent
			headerChildren={
				<Header>
					<HeaderContent
						member={member as unknown as MemberWithRelations}
						onEdit={() => setOpenEditForm(true)}
					/>
				</Header>
			}
		>
			<div className="pb-4 overflow-x-hidden">
				<GlobalStats member={member} attendanceData={attendanceData} />
			</div>
			{openEditForm && (
				<MemberFormDialog onClose={handleOnClose} member={member} />
			)}
		</MainContent>
	)
}
