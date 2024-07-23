import { Header } from '../../../components/layout/header'
import { MainContent } from '../../../components/layout/main-content'
import { Button } from '../../../components/ui/button'
import { InputSearch } from '../../../components/ui/input-search'
import { ChurchTable } from './components/churches-table'
import { type Church } from './components/columns'

function generateArray(): Church[] {
	return Array.from({ length: 100 }, (_, i) => ({
		id: generateId(),
		name: `Eglise ${i + 1}`,
		administratorName: `Admin ${i + 1}`,
		administratorPhoneNumber: generatePhoneNumber(),
	}))
}

function generateId(): string {
	return Math.random().toString(36).substring(2, 6)
}

function generatePhoneNumber(): string {
	return `07${Math.floor(Math.random() * 90000000) + 10000000}`
}

const data = generateArray()

export default function Church() {
	return (
		<MainContent
			headerChildren={
				<Header title="Gestion d'églises">
					<div className="sm:w-64">
						<InputSearch />
					</div>
					<Button variant={'gold'}>Créer une église</Button>
				</Header>
			}
		>
			<ChurchTable data={data} />
		</MainContent>
	)
}
