import {
	PrismaClient,
	Role,
	AttendanceReportEntity,
	$Enums,
} from '@prisma/client'
import { hash } from '@node-rs/argon2'
import invariant from 'tiny-invariant'
import { startOfWeek, endOfWeek, subWeeks, addDays } from 'date-fns'

const prisma = new PrismaClient()

async function seed() {
	await seedDB()
}

async function seedDB() {
	await createSuperAdmin()
	// Add this line to seed attendance reports for testing
	// await seedAttendanceReportsForTesting()
}

/**
 * Seeds attendance reports for testing report tracking queue
 * Creates various scenarios:
 * - Current week: Some reports submitted, some missing
 * - Previous weeks: Mix of compliant and non-compliant entities
 * - Multiple churches, tribes, departments, honor families
 */
async function seedAttendanceReportsForTesting() {
	console.log('🌱 Seeding attendance reports for testing...')

	// Get current week and previous weeks
	const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
	const previousWeek = subWeeks(currentWeek, 1)
	const twoWeeksAgo = subWeeks(currentWeek, 2)

	// Find existing data or create minimal test data
	let church = await prisma.church.findFirst()
	if (!church) {
		// Find existing church admin with ADMIN role
		const churchAdmin = await prisma.user.findFirst({
			where: {
				roles: {
					has: Role.ADMIN,
				},
			},
		})

		if (!churchAdmin) {
			throw new Error('No church admin found with ADMIN role')
		}

		church = await prisma.church.create({
			data: {
				name: 'Église Test',
				adminId: churchAdmin.id,
			},
		})
	}

	// Create many managers for 1000+ entities (need unique managers for each entity)
	console.log('🔄 Creating managers...')
	const managers: { id: string }[] = []

	for (let i = 1; i <= 1000; i++) {
		const manager = await createTestUser(
			`Manager ${i}`,
			`+336${String(i).padStart(8, '0')}`,
			church.id,
		)
		managers.push(manager)
	}

	console.log('🔄 Creating 300+ tribes...')
	const tribes = []
	for (let i = 1; i <= 300; i++) {
		const tribe = await prisma.tribe.create({
			data: {
				name: `Tribu ${i}`,
				churchId: church.id,
				managerId: managers[i - 1]?.id, // Managers 0-299
			},
		})
		tribes.push(tribe)
	}

	console.log('🔄 Creating 300+ departments...')
	const departments = []
	for (let i = 1; i <= 300; i++) {
		const dept = await prisma.department.create({
			data: {
				name: `Département ${i}`,
				churchId: church.id,
				managerId: managers[i + 299]?.id, // Managers 300-599
			},
		})
		departments.push(dept)
	}

	console.log('🔄 Creating 400+ honor families...')
	const honorFamilies = []
	for (let i = 1; i <= 400; i++) {
		const family = await prisma.honorFamily.create({
			data: {
				name: `Famille ${i}`,
				location: `Zone ${i % 10}`,
				churchId: church.id,
				managerId: managers[i + 599]?.id, // Managers 600-999
			},
		})
		honorFamilies.push(family)
	}

	// Create members for attendance records
	console.log('🔄 Creating members...')
	const members: {
		id: string
		name: string
		isActive: boolean
		createdAt: Date
		updatedAt: Date
		phone: string
		isAdmin: boolean
		location: string | null
		pictureUrl: string | null
		birthday: Date | null
		gender: $Enums.Gender | null
		maritalStatus: $Enums.MaritalStatus | null
		roles: $Enums.Role[]
		deletedAt: Date | null
		churchId: string | null
		tribeId: string | null
		honorFamilyId: string | null
		departmentId: string | null
	}[] = []
	for (let i = 1; i <= 100; i++) {
		const member = await createTestUser(
			`Membre ${i}`,
			`+337${String(i).padStart(8, '0')}`,
			church.id,
		)
		members.push(member)
	}

	console.log('📊 Creating 1000+ attendance reports...')

	const reportsToCreate = []

	// Current week - 400 reports (40% compliance)
	for (let i = 0; i < 400; i++) {
		const randomDay = Math.floor(Math.random() * 7) // Random day in current week
		const entityType =
			i < 150 ? 'TRIBE' : i < 300 ? 'DEPARTMENT' : 'HONOR_FAMILY'
		let entityId, managerId

		if (entityType === 'TRIBE' && tribes[i % tribes.length]) {
			entityId = tribes[i % tribes.length].id
			managerId = tribes[i % tribes.length].managerId
		} else if (
			entityType === 'DEPARTMENT' &&
			departments[i % departments.length]
		) {
			entityId = departments[i % departments.length].id
			managerId = departments[i % departments.length].managerId
		} else if (honorFamilies[i % honorFamilies.length]) {
			entityId = honorFamilies[i % honorFamilies.length].id
			managerId = honorFamilies[i % honorFamilies.length].managerId
		}

		if (entityId && managerId) {
			reportsToCreate.push({
				entity: entityType as AttendanceReportEntity,
				entityId,
				managerId,
				date: addDays(currentWeek, randomDay),
				week: 'current',
			})
		}
	}

	// Previous week - 350 reports
	for (let i = 0; i < 350; i++) {
		const randomDay = Math.floor(Math.random() * 7)
		const entityType =
			i < 120 ? 'TRIBE' : i < 240 ? 'DEPARTMENT' : 'HONOR_FAMILY'
		let entityId, managerId

		if (entityType === 'TRIBE' && tribes[i % tribes.length]) {
			entityId = tribes[i % tribes.length].id
			managerId = tribes[i % tribes.length].managerId
		} else if (
			entityType === 'DEPARTMENT' &&
			departments[i % departments.length]
		) {
			entityId = departments[i % departments.length].id
			managerId = departments[i % departments.length].managerId
		} else if (honorFamilies[i % honorFamilies.length]) {
			entityId = honorFamilies[i % honorFamilies.length].id
			managerId = honorFamilies[i % honorFamilies.length].managerId
		}

		if (entityId && managerId) {
			reportsToCreate.push({
				entity: entityType as AttendanceReportEntity,
				entityId,
				managerId,
				date: addDays(previousWeek, randomDay),
				week: 'previous',
			})
		}
	}

	// Two weeks ago - 300 reports
	for (let i = 0; i < 300; i++) {
		const randomDay = Math.floor(Math.random() * 7)
		const entityType =
			i < 100 ? 'TRIBE' : i < 200 ? 'DEPARTMENT' : 'HONOR_FAMILY'
		let entityId, managerId

		if (entityType === 'TRIBE' && tribes[i % tribes.length]) {
			entityId = tribes[i % tribes.length].id
			managerId = tribes[i % tribes.length].managerId
		} else if (
			entityType === 'DEPARTMENT' &&
			departments[i % departments.length]
		) {
			entityId = departments[i % departments.length].id
			managerId = departments[i % departments.length].managerId
		} else if (honorFamilies[i % honorFamilies.length]) {
			entityId = honorFamilies[i % honorFamilies.length].id
			managerId = honorFamilies[i % honorFamilies.length].managerId
		}

		if (entityId && managerId) {
			reportsToCreate.push({
				entity: entityType as AttendanceReportEntity,
				entityId,
				managerId,
				date: addDays(twoWeeksAgo, randomDay),
				week: 'twoWeeksAgo',
			})
		}
	}

	// Create reports in batches
	for (let i = 0; i < reportsToCreate.length; i += 50) {
		const batch = reportsToCreate.slice(i, i + 50)
		await Promise.all(
			batch.map(async reportData => {
				const randomMembers = members
					.sort(() => 0.5 - Math.random())
					.slice(0, Math.floor(Math.random() * 5) + 3) // 3-7 random members

				await createAttendanceReportSimple({
					entity: reportData.entity,
					entityId: reportData.entityId,
					managerId: reportData.managerId,
					date: reportData.date,
					members: randomMembers,
					comment: `Rapport automatique ${reportData.week} - ${reportData.entity}`,
				})
			}),
		)
		console.log(
			`📄 Created batch ${Math.floor(i / 50) + 1}/${Math.ceil(reportsToCreate.length / 50)}`,
		)
	}

	console.log('✅ Massive test data created successfully!')
	console.log(
		`📅 Current week: ${currentWeek.toLocaleDateString()} - ${endOfWeek(currentWeek, { weekStartsOn: 1 }).toLocaleDateString()}`,
	)
	console.log('📊 Summary:')
	console.log(`   • 1000 managers created`)
	console.log(`   • 300 tribes created`)
	console.log(`   • 300 departments created`)
	console.log(`   • 400 honor families created`)
	console.log(`   • 100 members created`)
	console.log(`   • 1000+ attendance reports created`)
	console.log(`   • Total entities: ${300 + 300 + 400} (1000+ entities)`)
	console.log('📈 Report distribution:')
	console.log('   • Current week: ~400 reports (40% compliance)')
	console.log('   • Previous week: ~350 reports (35% compliance)')
	console.log('   • Two weeks ago: ~300 reports (30% compliance)')
	console.log('🎯 Perfect for testing pagination with "Voir plus"!')
}

async function createTestUser(name: string, phone: string, churchId: string) {
	// Check if user already exists
	const existing = await prisma.user.findUnique({ where: { phone } })
	if (existing) return existing

	return prisma.user.create({
		data: {
			name,
			phone,
			churchId,
			roles: [Role.MEMBER],
		},
	})
}

async function createAttendanceReportSimple({
	entity,
	entityId,
	managerId,
	date,
	members,
	comment,
}: {
	entity: AttendanceReportEntity
	entityId: string
	managerId: string
	date: Date
	members: { id: string }[]
	comment: string
}) {
	const report = await prisma.attendanceReport.create({
		data: {
			entity,
			...(entity === 'TRIBE' && { tribeId: entityId }),
			...(entity === 'DEPARTMENT' && { departmentId: entityId }),
			...(entity === 'HONOR_FAMILY' && { honorFamilyId: entityId }),
			submitterId: managerId,
			comment,
			createdAt: date,
		},
	})

	// Create attendance records for members
	await Promise.all(
		members.map(member =>
			prisma.attendance.create({
				data: {
					date,
					memberId: member.id,
					reportId: report.id,
					inChurch: Math.random() > 0.3, // 70% attendance rate
					inService: Math.random() > 0.5, // 50% service attendance
					inMeeting: Math.random() > 0.4, // 60% meeting attendance
					createdAt: date,
				},
			}),
		),
	)
}

async function createSuperAdmin() {
	const { ARGON_SECRET_KEY, SUPER_ADMIN_PHONE, SUPER_ADMIN_PASSWORD } =
		process.env

	invariant(ARGON_SECRET_KEY, 'ARGON_SECRET_KEY must be defined in .env file')
	invariant(SUPER_ADMIN_PHONE, 'SUPER_ADMIN_PHONE must be defined in .env file')
	invariant(
		SUPER_ADMIN_PASSWORD,
		'SUPER_ADMIN_PASSWORD must be defined in .env file',
	)

	const hashedPassword = await hash(SUPER_ADMIN_PASSWORD, {
		secret: Buffer.from(ARGON_SECRET_KEY),
	})

	await prisma.user.create({
		data: {
			phone: SUPER_ADMIN_PHONE,
			name: 'Super Administrateur',
			roles: [Role.SUPER_ADMIN],
			churchId: undefined,
			isAdmin: true,
			password: {
				create: {
					hash: hashedPassword,
				},
			},
		},
	})
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
