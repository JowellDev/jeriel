import { json, type ActionFunctionArgs } from '@remix-run/node'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	return json({})
}

export type ActionType = typeof actionFn
