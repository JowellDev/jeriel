import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { loaderFn } from './loader.server'
import HeaderContent from './components/header-content'
import { useLoaderData } from '@remix-run/react'
import { type MemberWithRelations } from '~/models/member.model'
import GlobalStats from './components/global-stats'

export const loader = loaderFn

export default function MemberDetails() {
	const { member } = useLoaderData<typeof loader>()
	return (
		<MainContent
			headerChildren={
				<Header>
					<HeaderContent member={member as unknown as MemberWithRelations} />
				</Header>
			}
		>
			<div className="mt-2 pb-4">
				<GlobalStats member={member as unknown as MemberWithRelations} />
			</div>
		</MainContent>
	)
}
