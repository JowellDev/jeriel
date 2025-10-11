import { RiBuilding4Line, RiMailLine, RiPhoneLine } from '@remixicon/react'
import { getTranslatedUserRole } from '../utils'
import type { AuthenticatedUser } from '~/utils/auth.server'

interface Props {
	user: AuthenticatedUser
}

export function AccountDetails({ user }: Readonly<Props>) {
	const userRole = getTranslatedUserRole(user)

	return (
		<div className="flex flex-col space-y-2 items-center md:items-start">
			<span className="text-xl font-semibold">{user.name ?? 'N/D'}</span>
			<div className="flex items-center space-x-2">
				<RiMailLine />
				<span>{user.email ?? 'N/D'}</span>
			</div>
			<div className="flex items-center space-x-2">
				<RiPhoneLine />
				<span>{user.phone ?? 'N/D'}</span>
			</div>
			<div className="flex items-start space-x-2 text-wrap">
				<RiBuilding4Line />
				<span>{userRole}</span>
			</div>
		</div>
	)
}
