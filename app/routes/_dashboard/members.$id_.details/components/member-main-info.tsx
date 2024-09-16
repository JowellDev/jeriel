import { RiAccountCircleFill, RiPhoneLine, RiHome3Line } from '@remixicon/react'

export default function MemberMainInfo() {
	return (
		<div className="flex items-center space-x-5 text-sm">
			<div className="flex items-center space-x-1">
				<RiAccountCircleFill size={26} />
				<span className="font-semibold">Joël Ephraïm Digbeu</span>
			</div>
			<div className="flex items-center space-x-2 divide-x-2 divide-neutral-300 text-sm">
				<div className="flex items-center space-x-1">
					<RiPhoneLine size={14} />
					<span>0707827311</span>
				</div>
				<div className="flex items-center space-x-1 pl-2">
					<RiHome3Line size={14} />
					<span>Abobo Baoulé</span>
				</div>
			</div>
		</div>
	)
}
