import { parseWithZod } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { prisma } from '~/utils/db.server'
import { generateTOTP } from '~/utils/otp.server'
import { getDomain } from '~/utils/url.server'
import { schema } from './schema'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema })

	if (submission.status !== 'success')
		return json(
			{ submission: submission.reply(), success: false },
			{ status: 400 },
		)

	const { phone } = submission.value

	const user = await prisma.user.findFirst({ where: { phone } })

	if (!user) {
		return json({
			success: true,
			submission: { payload: {}, error: {}, intent: '' },
		} as const)
	}

	invariant(user, 'User must be defined')

	await prisma.verification.deleteMany({
		where: { phone },
	})

	const digits = 6

	const { otp, algorithm, secret, expiresAt, step } = generateTOTP(digits)

	await prisma.verification.create({
		data: { algorithm, expiresAt, period: step, secret, digits, phone },
	})

	const verifyLink = new URL(`${getDomain(request)}/password-forgotten/verify`)
	verifyLink.searchParams.set('otp', otp)
	verifyLink.searchParams.set('phone', phone)

	//send otp here !

	return json({
		success: true,
		submission: { payload: {}, error: {}, intent: '' },
	} as const)
}

export type ActionType = typeof actionFn
