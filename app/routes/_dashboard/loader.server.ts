import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'

function readSidebarState(request: Request): boolean {
	const cookie = request.headers.get('Cookie') ?? ''
	const match = cookie.match(/(?:^|;\s*)sidebar:state=(true|false)/)
	return match ? match[1] === 'true' : true
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	return {
		user: await requireUser(request),
		sidebarOpen: readSidebarState(request),
	}
}
