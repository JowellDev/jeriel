import { type User } from '@prisma/client'
import { RiBuilding4Line, RiPhoneLine } from '@remixicon/react'

interface Props {
	user: User
}

export function AccountDetails({ user }: Readonly<Props>) {
	return (
		<div className="flex flex-col space-y-2 items-center md:items-start">
			<span className="text-xl font-semibold">{user.name ?? 'N/D'}</span>
			<div className="flex items-center space-x-2">
				<RiPhoneLine />
				<span>{user.phone}</span>
			</div>
			<div className="flex items-center space-x-2">
				<RiBuilding4Line />
				<span>Responsable tribu - Josaphat</span>
			</div>
		</div>
	)
}
