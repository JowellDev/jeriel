import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import invariant from 'tiny-invariant'

const {
	SMTP_HOST,
	SMTP_PORT,
	SMTP_USERNAME,
	SMTP_PASSWORD,
	SMTP_FROM,
	SMTP_FROM_NAME,
	NODE_ENV,
} = process.env

invariant(SMTP_HOST, 'SMTP_HOST be must defined in .env')
invariant(SMTP_PORT, 'SMTP_PORT be must defined in .env')
invariant(SMTP_FROM, 'SMTP_FROM be must defined in .env')
invariant(SMTP_FROM_NAME, 'SMTP_FROM_NAME be must defined in .env')

const options = {
	host: SMTP_HOST,
	port: Number(SMTP_PORT),
	secure: NODE_ENV === 'production',
	...(SMTP_USERNAME &&
		SMTP_PASSWORD && {
			auth: {
				user: SMTP_USERNAME,
				pass: SMTP_PASSWORD,
			},
		}),
} as SMTPTransport.Options

const mailer = nodemailer.createTransport(options)

function sendMail(to: string, subject: string, html: string) {
	return mailer.sendMail({
		to,
		subject,
		html,
		from: `"${SMTP_FROM_NAME}" ${SMTP_FROM}`,
	})
}

export { mailer, sendMail }
