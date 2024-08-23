import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { TribeTable } from './components/tribe-table'

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
		>
			<div className="flex flex-col gap-5">
				<Card className="space-y-2 pb-4 mb-2">
					<TribeTable data={[]} />
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
		</MainContent>
	)
}
