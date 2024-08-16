import { RiBuilding4Line } from '@remixicon/react'

export function AccountDetails() {
	return (
		<div className="flex flex-col space-y-2 items-center md:items-start">
			<span className="text-xl font-semibold">Administrateur</span>
			<span>monmail@gmail.com</span>
			<div className="flex items-center space-x-2">
				<RiBuilding4Line />
				<span>Responsable tribu - Josaphat</span>
			</div>
		</div>
	)
}
