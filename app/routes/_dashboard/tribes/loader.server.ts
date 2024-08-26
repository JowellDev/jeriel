import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { type Tribe } from './types'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	await requireUser(request)

	const data = new Array(13).fill(null).map((_, index) => ({
		id: `${index + 1}`,
		name: `Tribu ${index + 1}`,
		members: new Array(45).fill(null).map((_, index) => ({
			id: `${index + 1}`,
			name: 'Member John Cruz',
			phone: '225 0758665523',
			location: 'France',
			createdAt: new Date(),
		})),
		createdAt: new Date(),
		tribeManager: {
			id: `${index + 1}`,
			name: 'Manager John Doe',
			phone: '225 0758992417',
			location: 'France',
			createdAt: new Date(),
		},
	})) as Tribe[]

	return json({ data })
}
