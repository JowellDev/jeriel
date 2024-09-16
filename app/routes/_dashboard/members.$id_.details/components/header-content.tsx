import { Link } from '@remix-run/react'
import {
	RiArrowLeftLine,
	RiPencilLine,
	RiFileExcel2Line,
} from '@remixicon/react'
import MemberMainInfo from './member-main-info'
import { Button } from '~/components/ui/button'

export default function HeaderContent() {
	return (
		<div className="w-full flex justify-between items-center">
			<div className="flex items-center space-x-2 divide-x-2 divide-neutral-400">
				<Link to="/members">
					<Button variant="ghost" className="space-x-1">
						<RiArrowLeftLine size={16} />
						<span>Retour</span>
					</Button>
				</Link>
				<div className="pl-2">
					<MemberMainInfo />
				</div>
			</div>
			<div className="flex space-x-2">
				<Button variant="outline" size="sm" className="border-input">
					<RiPencilLine size={18} />
				</Button>
				<Button variant="outline" size="sm" className="border-input">
					Janvier 2024
				</Button>
				<Button variant="outline" size="sm" className="space-x-1 border-input">
					<span>Exporter</span>
					<RiFileExcel2Line />
				</Button>
			</div>
		</div>
	)
}
