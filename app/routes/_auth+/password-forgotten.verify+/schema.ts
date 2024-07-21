import { z } from 'zod'
import { prisma } from '~/utils/db.server'
import { verifyTOTP } from '~/utils/otp.server'

export const verificationSchema = z.object({
	otp: z
		.string({ required_error: 'Veuillez entrer le code OTP de vérification' })
		.min(6, 'Veuillez entrer un code OTP de 6 caractères')
		.max(6, 'OTP invalide'),
	email: z
		.string({ required_error: 'Veuillez entrer une adresse email valide' })
		.email('Adresse e-mail invalide'),
})

export const refinedSchema = verificationSchema.superRefine(
	async (object, ctx) => {
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
	},
)
