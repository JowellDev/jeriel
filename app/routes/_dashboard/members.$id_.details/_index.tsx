import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { loaderFn } from './loader.server'
import HeaderContent from './components/header-content'
import { useLoaderData } from '@remix-run/react'
import { type MemberWithRelations } from '~/models/member.model'
import GlobalStats from './components/global-stats'
import { MemberFormDialog } from '../members.($id)/components/member-form-dialog'
import { useState } from 'react'

export const loader = loaderFn

export default function MemberDetails() {
	const { member } = useLoaderData<typeof loader>()
	const [openEditForm, setOpenEditForm] = useState(false)

	function handleOnClose() {
		setOpenEditForm(false)
	}

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
			<div className="mt-2 pb-4">
				<GlobalStats member={member as unknown as MemberWithRelations} />
			</div>
			{openEditForm && (
				<MemberFormDialog
					onClose={handleOnClose}
					member={member as unknown as MemberWithRelations}
				/>
			)}
		</MainContent>
	)
}
