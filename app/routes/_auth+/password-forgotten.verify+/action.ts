import { parse } from '@conform-to/zod'
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { prisma } from '~/utils/db.server'
import { verifyTOTP } from '~/utils/otp.server'
import { commitSession, getSession } from '~/utils/session.server'
import { RESET_PASSWORD_SESSION_KEY } from '../reset-password+/constants'

export const clientSchema = z.object({
	otp: z.coerce
		.string()
		.min(6, 'You must enter a 6 digits OTP')
		.max(6, 'Invalid OTP'),
	email: z.coerce.string().email('You must enter a valid email address'),
})

const schema = clientSchema.superRefine(async (object, ctx) => {
	const { otp, email } = object

	const verification = await prisma.verification.findFirst({
		where: { expiresAt: { gt: new Date() }, email },
		select: {
			algorithm: true,
			digits: true,
			email: true,
			period: true,
			secret: true,
		},
	})

	if (!verification) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'Invalid OTP',
			path: ['otp'],
		})
		return
	}

	const { period, algorithm, digits, secret } = verification
	const isValidOtp = verifyTOTP({ otp, digits, period, algorithm, secret })

	if (!isValidOtp) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'Invalid OTP',
			path: ['otp'],
		})
	}
})

const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()

	return validate(request, formData)
}

export async function validate(
	request: Request,
	formData: FormData | URLSearchParams,
) {
	const submission = await parse(formData, {
		schema: schema,
		async: true,
	})

	if (!submission.value || submission.intent !== 'submit')
		return json({ submission }, { status: 400 })

	await prisma.verification.deleteMany({
		where: { email: submission.value.email },
	})

	const session = await getSession(request.headers.get('Cookie'))
	session.set(RESET_PASSWORD_SESSION_KEY, submission.value.email)

	return redirect('/reset-password', {
		headers: { 'Set-Cookie': await commitSession(session) },
	})
}

export default action
export type Action = typeof action
