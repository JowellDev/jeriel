import { Link, useSearchParams } from '@remix-run/react'
import {
	RiArrowLeftLine,
	RiPencilLine,
	RiFileExcel2Line,
	RiAccountCircleFill,
} from '@remixicon/react'
import { Button } from '~/components/ui/button'
import { type Member } from '~/models/member.model'

interface Props {
	member: Member
}

export default function HeaderContent({ member }: Readonly<Props>) {
	const [searchParams] = useSearchParams()

	const from = searchParams.get('from')
	const id = searchParams.get('id')

	const getBackLink = () => {
		switch (from) {
			case 'tribe':
				return `/tribes/${id}/details`
			default:
				return '/members'
		}
	}
	return (
		<div className="w-full flex justify-between items-center">
			<div className="flex items-center space-x-2 divide-x-2 divide-neutral-400">
				<Link to={getBackLink()}>
					<Button variant="ghost" className="space-x-1">
						<RiArrowLeftLine size={16} />
						<span>Retour</span>
					</Button>
				</Link>
				<div className="pl-2">
					<div className="flex items-center space-x-5 text-sm">
						<div className="flex items-center space-x-1">
							<RiAccountCircleFill size={26} />
							<span className="font-semibold">{member.name}</span>
						</div>
						<div className="flex items-center space-x-2 divide-x-2 divide-neutral-300 text-sm">
							<div className="flex items-center space-x-1">
								<span>📞</span>
								<span>{member.phone}</span>
							</div>
							{member.location && (
								<div className="flex items-center space-x-1 pl-2">
									<span>🏠</span>
									<span>{member.location}</span>
								</div>
							)}
						</div>
					</div>
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
