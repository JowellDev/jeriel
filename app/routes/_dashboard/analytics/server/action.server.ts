import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, json } from '@remix-run/node'
import { exportSchema } from '../schema'
import { gatherAnalyticsInputs } from './gather.server'
import { createAnalyticsExcelFile } from '../utils/export.server'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema: exportSchema })

	if (submission.status !== 'success') {
		return json({ status: 'error', fileLink: undefined } as const, {
			status: 400,
		})
	}

	const { dataset, ...filter } = submission.value
	const exportRequest = buildExportRequest(request, filter)
	const inputs = await gatherAnalyticsInputs(exportRequest)
	const fileLink = await createAnalyticsExcelFile(dataset, inputs)

	return json({ status: 'success', fileLink } as const)
}

/**
 * Rejoue le filtre (entité/période) dans une requête GET pour réutiliser
 * `gatherAnalyticsInputs`, qui lit les paramètres depuis l'URL.
 */
function buildExportRequest(
	request: Request,
	filter: Record<string, string>,
): Request {
	const url = new URL(request.url)
	for (const [key, value] of Object.entries(filter)) {
		if (value) url.searchParams.set(key, value)
	}
	return new Request(url, { headers: request.headers })
}

export type ActionType = typeof actionFn
