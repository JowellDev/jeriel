import { RiBuilding4Line, RiPhoneLine } from '@remixicon/react'
import { getUserDetails, type User } from '../utils'

interface Props {
	user: User
}

export function AccountDetails({ user }: Readonly<Props>) {
	const { roleName } = getUserDetails(user)

	return (
		<div className="flex flex-col space-y-2 items-center md:items-start">
			<span className="text-xl font-semibold">{user.name ?? 'N/D'}</span>
			<div className="flex items-center space-x-2">
				<RiPhoneLine />
				<span>{user.phone}</span>
			</div>
			<div className="flex items-start space-x-2 text-wrap">
				<RiBuilding4Line />
				<span> {roleName}</span>
			</div>
		</div>
	)
}
