import { json, type ActionFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import invariant from 'tiny-invariant'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { id: memberId } = params
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')

	return json({ status: 200 })
}

export type ActionData = typeof actionFn
