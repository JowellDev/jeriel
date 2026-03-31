import { prisma } from '~/infrastructures/database/prisma.server'

export async function findOrCreateTribes(tribes: string[], churchId: string) {
	return Promise.all(
		tribes.map(async tribe => {
			let existingTribe

			existingTribe = await prisma.tribe.findFirst({ where: { name: tribe } })

			if (!existingTribe) {
				existingTribe = await prisma.tribe.create({
					data: {
						name: tribe,
						church: { connect: { id: churchId } },
					},
				})
			}

			return {
				id: existingTribe.id,
				name: existingTribe.name,
			}
		}),
	)
}

export async function findOrCreateDepartments(
	departments: string[],
	churchId: string,
) {
	return Promise.all(
		departments.map(async department => {
			let existing = await prisma.department.findFirst({
				where: { name: department },
			})

			if (!existing) {
				existing = await prisma.department.create({
					data: {
						name: department,
						church: { connect: { id: churchId } },
					},
				})
			}

			return { id: existing.id, name: existing.name }
		}),
	)
}

export async function findOrCreateHonorFamilies(
	families: string[],
	churchId: string,
) {
	return Promise.all(
		families.map(async family => {
			let existing = await prisma.honorFamily.findFirst({
				where: { name: family },
			})

			if (!existing) {
				existing = await prisma.honorFamily.create({
					data: {
						name: family,
						location: 'N/D',
						church: { connect: { id: churchId } },
					},
				})
			}

			return { id: existing.id, name: existing.name }
		}),
	)
}
