import { prisma } from '~/utils/db.server'

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

			console.log('existingTribe =======>', existingTribe)

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
	const result = []

	for (const department of departments) {
		let existingDepartment

		existingDepartment = await prisma.department.findFirst({
			where: { name: department },
		})

		if (!existingDepartment) {
			existingDepartment = await prisma.department.create({
				data: {
					name: department,
					church: { connect: { id: churchId } },
				},
			})
		}

		result.push({ id: existingDepartment.id, name: existingDepartment.name })
	}

	return result
}

export async function findOrCreateHonorFamilies(
	families: string[],
	churchId: string,
) {
	const result = []

	for (const family of families) {
		let existingFamily

		existingFamily = await prisma.honorFamily.findFirst({
			where: { name: family },
		})

		if (!existingFamily) {
			existingFamily = await prisma.honorFamily.create({
				data: {
					name: family,
					location: 'N/A',
					church: { connect: { id: churchId } },
				},
			})
		}

		result.push({ id: existingFamily.id, name: existingFamily.name })
	}

	return result
}
