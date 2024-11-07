import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { type MetaFunction } from '@remix-run/node'
import { TableToolbar } from '~/components/toolbar'

export const meta: MetaFunction = () => [{ title: 'Gestion des membres' }]

export default function HonorFamily() {
	return (
		<MainContent headerChildren={<Header title="Famille d'honneur"></Header>}>
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
