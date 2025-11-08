import { z } from 'zod'
import { prisma } from '~/utils/db.server'
import { verifyTOTP } from '~/utils/otp.server'

export const verificationSchema = z.object({
	otp: z
		.string({ required_error: 'Veuillez entrer le code OTP de vérification' })
		.min(6, 'Veuillez entrer un code OTP de 6 caractères')
		.max(6, 'OTP invalide'),
	email: z
		.string({
			required_error: 'Veuillez entrer votre adresse email',
		})
		.email({
			message: 'Adresse email invalide',
		}),
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
				step: true,
				secret: true,
			},
		})

		if (!verification) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Code OTP invalide ou expiré',
				path: ['otp'],
			})
			return
		}

		const { step: period, algorithm, digits, secret } = verification
		const isValidOtp = verifyTOTP({ otp, digits, period, algorithm, secret })

		if (!isValidOtp) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'OTP invalide',
				path: ['otp'],
			})
		}
	},
)
