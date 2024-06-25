import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { getUserId } from '~/utils/auth.server';

export default async ({ request }: LoaderFunctionArgs) => {
	const userId = await getUserId(request)
	if (userId) return redirect('/')

	return json({})
}
