import { parseWithZod } from '@conform-to/zod'
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { prisma } from '~/utils/db.server'
import { generateTOTP } from '~/utils/otp.server'
import { schema } from './schema'
import { commitSession, getSession } from '~/utils/session.server'
import { VERIFY_PHONE_SESSION_KEY } from '../password-forgotten.verify+/constants'
import { URLSearchParams } from 'url'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema })

	if (submission.status !== 'success')
		return json(
			{
				success: false,
				message: undefined,
				submission: submission.reply(),
			} as const,
			{ status: 400 },
		)

	const { phone } = submission.value

	const user = await prisma.user.findFirst({ where: { phone } })

	if (!user) {
		return json({
			success: false,
			message: 'Numéro invalide!',
			submission: submission.reply(),
		} as const)
	}

	await prisma.verification.deleteMany({
		where: { phone },
	})

	const digits = 6

	const { otp, algorithm, secret, expiresAt, step } = generateTOTP(digits)

	await prisma.verification.create({
		data: { algorithm, expiresAt, period: step, secret, digits, phone },
	})

	try {
		await sendOTP(otp, phone)

		const session = await getSession(request.headers.get('Cookie'))
		session.set(VERIFY_PHONE_SESSION_KEY, phone)

		return redirect('/password-forgotten/verify', {
			headers: { 'Set-Cookie': await commitSession(session) },
		})
	} catch (error) {
		return json(
			{
				success: false,
				message: 'Veuillez réessayer plutard!',
				submission: submission.reply(),
			} as const,
			{ status: 400 },
		)
	}
}

async function sendOTP(otp: string, phone: string) {
	const MESSAGE_SENDER_ID = process.env.MESSAGE_SENDER_ID
	const LETEXTO_API_URL = process.env.LETEXTO_API_URL
	const LETEXTO_API_TOKEN = process.env.LETEXTO_API_TOKEN

	invariant(MESSAGE_SENDER_ID, 'MESSAGE_SENDER_ID must be defined')
	invariant(LETEXTO_API_URL, 'LETEXTO_API_URL must be defined')
	invariant(LETEXTO_API_TOKEN, 'LETEXTO_API_TOKEN must be defined')

	console.log('otp ====> ', otp)

	const params = new URLSearchParams({
		from: MESSAGE_SENDER_ID,
		to: phone.replace(/^(00225|\+225)?/, '225'),
		content: `Votre code OTP est: ${otp}`,
		token: LETEXTO_API_TOKEN,
	})

	return fetch(`${LETEXTO_API_URL}?${params.toString()}`, { method: 'GET' })
}

export type ActionType = typeof actionFn
