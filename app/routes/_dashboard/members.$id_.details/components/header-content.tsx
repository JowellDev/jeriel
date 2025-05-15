import { RiArrowLeftLine } from '@remixicon/react'
import { useNavigate } from '@remix-run/react'
import { Button } from '~/components/ui/button'
import { useMediaQuery } from 'usehooks-ts'
import { MOBILE_WIDTH } from '~/shared/constants'

export default function HeaderContent() {
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
		</div>
	)
}
