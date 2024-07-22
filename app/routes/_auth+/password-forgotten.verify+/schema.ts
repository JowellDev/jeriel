import { z } from 'zod'
import { prisma } from '~/utils/db.server'
import { verifyTOTP } from '~/utils/otp.server'

export const verificationSchema = z.object({
	otp: z
		.string({ required_error: 'Veuillez entrer le code OTP de vérification' })
		.min(6, 'Veuillez entrer un code OTP de 6 caractères')
		.max(6, 'OTP invalide'),
	phone: z
		.string({
			required_error: 'Veuillez entrer votre numéro de téléphone',
		})
		.regex(/^\d{10}$/, {
			message: 'Numéro de téléphone invalide',
		}),
})

export const refinedSchema = verificationSchema.superRefine(
	async (object, ctx) => {
		const { otp, phone } = object

		const verification = await prisma.verification.findFirst({
			where: { expiresAt: { gt: new Date() }, phone },
			select: {
				algorithm: true,
				digits: true,
				phone: true,
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
				message: 'OTP invalide',
				path: ['otp'],
			})
		}
	},
)
