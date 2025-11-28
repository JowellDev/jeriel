import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { commitSession, getSession } from '~/helpers/session'
import { requireAnonymous } from '~/utils/auth.server'
import { RESET_PASSWORD_EMAIL_SESSION_KEY } from '../reset-password+/constants'
import { prisma } from '~/infrastructures/database/prisma.server'
import { verifyTOTP } from '~/utils/otp.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	await requireAnonymous(request)

	const searchParams = new URL(request.url).searchParams

	const email = searchParams.get('email')
	const otp = searchParams.get('otp')

	if (!email || !otp) return null

	const isValid = await validateOTPWithEmail(otp, email)

	if (!isValid) return null

	const session = await getSession(request.headers.get('Cookie'))
	session.set(RESET_PASSWORD_EMAIL_SESSION_KEY, email)

	throw redirect('/reset-password', {
		headers: {
			'Set-Cookie': await commitSession(session),
		},
	})
}

export type LoaderType = typeof loaderFn

async function validateOTPWithEmail(
	otp: string,
	email: string,
): Promise<boolean> {
	const verification = await prisma.verification.findFirst({
		where: { email },
	})

	if (!verification) return false

	return verifyTOTP({ ...verification, otp })
}
