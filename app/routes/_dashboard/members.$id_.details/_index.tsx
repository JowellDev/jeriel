import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { loaderFn } from './loader.server'
import HeaderContent from './components/header-content'
import { useLoaderData } from '@remix-run/react'
import GlobalStats from './components/global-stats'
import MemberFormDialog from '../members.($id)/components/member-form-dialog'
import { useState } from 'react'
import { getMemberAttendanceData } from './utils/member-data'
import { GeneralInfosCard } from './components/general-infos-card'

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
					<HeaderContent />
				</Header>
			}
		>
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="w-full sm:w-96 sm:sticky top-0 h-full">
					<GeneralInfosCard
						member={member}
						onEdit={() => setOpenEditForm(true)}
					/>
				</div>
				<GlobalStats member={member} attendanceData={attendanceData} />
			</div>

			{openEditForm && (
				<MemberFormDialog onClose={handleOnClose} member={member} />
			)}
		</MainContent>
	)
}
