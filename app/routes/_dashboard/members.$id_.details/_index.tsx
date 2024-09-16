import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { loaderFn } from './loader.server'
import HeaderContent from './components/header-content'
import { useLoaderData } from '@remix-run/react'
import { type Member } from '~/models/member.model'
import GlobalStats from './components/global-stats'

export const loader = loaderFn

export default function MemberDetails() {
	const { member } = useLoaderData<typeof loader>()
	return (
		<MainContent
			headerChildren={
				<Header>
					<HeaderContent member={member as unknown as Member} />
				</Header>
			}
		>
			<div className="mt-4 p-0 px-1 pb-8 sm:px-4">
				<GlobalStats />
			</div>
		</MainContent>
	)
}
