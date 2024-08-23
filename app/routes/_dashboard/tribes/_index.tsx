import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'

export default function Tribe() {
	return (
		<MainContent
			headerChildren={
				<Header title="Tribus">
					<div className="hidden sm:block"></div>
					<Button className="hidden sm:block" variant={'gold'}>
						Créer une tribu
					</Button>
				</Header>
			}
		></MainContent>
	)
}
