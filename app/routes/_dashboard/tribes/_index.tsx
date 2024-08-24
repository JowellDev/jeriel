import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { TribeTable } from './components/tribe-table'
import { useState } from 'react'
import { TribeFormDialog } from './components/tribe-form-dialog'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine } from '@remixicon/react'

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Créer un tribu',
		action: 'add-tribe',
	},
]

export default function Tribe() {
	const [openTribeForm, setOpenTribeForm] = useState(false)

	const handleSpeedDialItemClick = (action: string) => {
		setOpenTribeForm(true)
	}

	return (
		<MainContent
			headerChildren={
				<Header title="Tribus">
					<div className="hidden sm:block"></div>
					<Button
						className="hidden sm:block"
						variant={'gold'}
						onClick={() => setOpenTribeForm(true)}
					>
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
			{openTribeForm && (
				<TribeFormDialog onClose={() => setOpenTribeForm(false)} />
			)}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
