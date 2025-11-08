import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import { generateTOTP } from '~/utils/otp.server'
import { schema } from './schema'
import type { User, Verification } from '@prisma/client'
import { getDomain } from '~/utils/url'
import { sendMail } from '~/utils/mailer.server'
import { render } from '@react-email/render'
import { PasswordForgottenEmail } from '~/emails/password-forgotten-email'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.formData()
	const submission = parseWithZod(formData, { schema })

	const domain = getDomain(request)

	if (submission.status !== 'success') return submission.reply()

	try {
		const { email } = submission.value

		const user = await prisma.user.findFirstOrThrow({ where: { email } })

		const { verificationLink } = await createVerificationLink(user, domain)

		const emailHtml = render(<PasswordForgottenEmail link={verificationLink} />)

		await sendMail(email, 'Réinitialisation de mot de passe', emailHtml)

		return { status: 'success' } as const
	} catch (error) {
		return { status: 'success' } as const
	}
}

async function createVerificationLink(user: User, domain: string) {
	const verification = await createVerification(user.email!)

	const verificationLink = `${domain}/verify?email=${verification.email}&otp=${verification.otp}`

	return { verificationLink, otp: verification.otp }
}

async function createVerification(
	email: string,
): Promise<Verification & { otp: string }> {
	const digits = 6

	const { otp, ...args } = generateTOTP(digits)

	await prisma.verification.deleteMany({ where: { email } })

	const verification = await prisma.verification.create({
		data: { email, digits, ...args },
	})

	return { ...verification, otp }
}

export type ActionType = typeof actionFn
