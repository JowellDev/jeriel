import { z } from 'zod'

export const PWD_REGEX =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/

export const PHONE_NUMBER_REGEX = /^(225\d{10}|\d{10})$/
export const MOBILE_WIDTH = '(min-width: 768px)'

export const MEMBER_SCHEMA = z.object({
	name: z.string(),
	phone: z.string().regex(PHONE_NUMBER_REGEX, {
		message: 'Numéro de numéro invalide',
	}),
	location: z.string(),
})
