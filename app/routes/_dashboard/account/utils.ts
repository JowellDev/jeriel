import type { AuthenticatedUser } from '~/utils/auth.server'

export function getTranslatedUserRole(user: AuthenticatedUser) {
	const role = user.roles[0]

	const roleNames = {
		SUPER_ADMIN: 'Super administrateur',
		ADMIN: `Administrateur église - ${user.church?.name ?? 'N/D'}`,
		TRIBE_MANAGER: `Responsable Tribu - ${user.tribe?.name ?? 'N/D'}`,
		DEPARTMENT_MANAGER: `Responsable Département - ${user.department?.name ?? 'N/D'}`,
		HONOR_FAMILY_MANAGER: `Responsable famille d'honneur - ${user.honorFamily?.name ?? 'N/D'}`,
		MEMBER: 'Membre',
	}

	return roleNames[role] || 'N/D'
}
