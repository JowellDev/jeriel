import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { loaderFn } from './loader.server'
import HeaderContent from './components/header-content'
import { useLoaderData } from '@remix-run/react'
import { type Member } from '~/models/member.model'

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
			<div>
				<h1>Hello world</h1>
			</div>
		</MainContent>
	)
}
