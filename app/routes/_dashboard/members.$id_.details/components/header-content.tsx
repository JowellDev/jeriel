import {
	RiArrowLeftLine,
	RiPencilLine,
	RiFileExcel2Line,
} from '@remixicon/react'
import { useNavigate } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { useMediaQuery } from 'usehooks-ts'
import { MOBILE_WIDTH } from '~/shared/constants'

interface Props {
	onEdit: () => void
}

export default function HeaderContent({ onEdit }: Readonly<Props>) {
	const navigate = useNavigate()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	return (
		<div className="w-full flex justify-between items-center">
			<div className="flex items-center space-x-2 divide-x-2 divide-neutral-400">
				<Button
					variant="ghost"
					className="space-x-1"
					onClick={() => navigate(-1)}
					size={isDesktop ? 'sm' : 'icon'}
				>
					<RiArrowLeftLine size={20} />
					{isDesktop && <span>Retour</span>}
				</Button>
			</div>
			<div className="flex space-x-2">
				<Button
					variant="outline"
					size="sm"
					className="border-input"
					onClick={onEdit}
				>
					<RiPencilLine size={20} />
				</Button>
				<Button variant="outline" size="sm" className="space-x-1 border-input">
					<span>Exporter</span>
					<RiFileExcel2Line />
				</Button>
			</div>
		</div>
	)
}
