import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import type { FairthfulWithMonthlyAttendances } from './types'
import { getcurrentMonthSundays } from '~/utils/date'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	await requireUser(request)
	const currentMonthSundays = getcurrentMonthSundays()

	const data = new Array(10).fill(null).map((_, index) => ({
		id: `${index + 1}`,
		name: 'John Doe',
		phone: '123456789',
		location: 'France',
		createdAt: new Date(),
		lastMonthAttendanceResume: {
			attendace: Math.floor(Math.random() * 4),
			sundays: 4,
		},
		currentMonthAttendanceResume: {
			attendace: Math.floor(Math.random() * 4),
			sundays: 4,
		},
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			isPresent: Math.random() > 0.5,
		})),
	})) as FairthfulWithMonthlyAttendances[]

	return json({ data })
}
