import { RiAccountCircleFill } from '@remixicon/react'
import { type Member } from '~/models/member.model'

interface Props {
	member: Member
}

export default function MemberMainInfo({ member }: Readonly<Props>) {
	return (
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
	)
}
