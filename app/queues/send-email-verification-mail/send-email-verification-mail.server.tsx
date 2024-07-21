import { render } from '@react-email/render'
import { Queue } from 'quirrel/remix'
import VerifyEmail from '~/emails/verify.email.server'
import { sendMail } from '~/utils/mailer.server'

export default Queue<{ email: string; otp: string; verifyLink: string }>(
	'queues/send-email-verification-mail',
	async data => {
		const html = render(<VerifyEmail {...data} />)
		const subject = 'Vérification'

		await sendMail(data.email, subject, html)
	},
	{ retry: ['1min', '5min', '10min'] },
)
