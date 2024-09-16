import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { loaderFn } from './loader.server'
import HeaderContent from './components/header-content'

export const loader = loaderFn

export default function MemberDetails() {
	return (
		<MainContent
			headerChildren={
				<Header>
					<HeaderContent />
				</Header>
			}
		>
			<div>
				<h1>Hello world</h1>
			</div>
		</MainContent>
	)
}
