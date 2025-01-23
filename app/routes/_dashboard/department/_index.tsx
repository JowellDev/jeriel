import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { type MetaFunction } from '@remix-run/node'
import { TableToolbar } from '~/components/toolbar'
import { RiAddLine } from '@remixicon/react'
import { type SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'
import { loaderFn } from '../loader.server'

const SPEED_DIAL_ACTIONS = {
	ADD_MEMBER: 'add-member',
}

const SPEED_DIAL_ITEMS: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Créer un fidèle',
		action: SPEED_DIAL_ACTIONS.ADD_MEMBER,
	},
]

export const meta: MetaFunction = () => [{ title: 'Gestion de mon départment' }]

export const loader = loaderFn

export default function Department() {
	return (
		<MainContent headerChildren={<Header title="Département"></Header>}>
			<div className="flex flex-col gap-5">
				<TableToolbar
					searchContainerClassName="sm:w-1/3"
					align="end"
					onExport={() => 2}
				/>
				<Card className="space-y-2 pb-4 mb-2">
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
