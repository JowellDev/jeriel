import { type Role } from '@prisma/client'

export type User = {
	id: string
	name: string
	phone: string
	roles: Role[]
	tribe: { name: string } | null
	department: { name: string } | null
	honorFamily: { name: string } | null
	church: { name: string } | null
}

export function getUserDetails(user: User) {
	let roleName = ''
	const { roles, tribe, department, honorFamily, church } = user

	if (roles[0] === 'SUPER_ADMIN') {
		roleName = `Super administrateur`
	}

	if (roles[0] === 'ADMIN') {
		roleName = `Administrateur église - ${church?.name}`
	}

	if (roles.includes('TRIBE_MANAGER')) {
		roleName = `Responsable Tribu - ${tribe?.name}`
	}

	if (roles.includes('DEPARTMENT_MANAGER')) {
		roleName = `Responsable Département - ${department?.name}`
	}

	if (roles.includes('HONOR_FAMILY_MANAGER')) {
		roleName = `Responsable famille d'honneur - ${honorFamily?.name}`
	}

	return { roleName }
}
