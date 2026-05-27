import invariant from 'tiny-invariant'
import { type Prisma } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'

const MESSAGE_SENDER_ID = process.env.MESSAGE_SENDER_ID
const LETEXTO_API_URL = process.env.LETEXTO_API_URL
const LETEXTO_API_TOKEN = process.env.LETEXTO_API_TOKEN

async function saveMessage(data: Prisma.MessageCreateInput) {
	return prisma.message.create({ data })
}

async function updateMessage(id: string, data: Prisma.MessageUpdateInput) {
	await prisma.message.update({ where: { id }, data })
}

function buildSmsPayload(content: string, phone: string) {
	return {
		from: MESSAGE_SENDER_ID!,
		to: phone.replace(/^(\+|00)/, ''),
		content,
	}
}

async function sendMessage(content: string, phone: string) {
	if (!LETEXTO_API_TOKEN) return
	invariant(MESSAGE_SENDER_ID, 'MESSAGE_SENDER_ID must be defined')
	invariant(LETEXTO_API_URL, 'LETEXTO_API_URL must be defined')

	const payload = buildSmsPayload(content, phone)
	const params = new URLSearchParams({
		...payload,
		token: LETEXTO_API_TOKEN,
		dlrUrl: ``,
	})
	const response = await fetch(`${LETEXTO_API_URL}?${params.toString()}`, {
		method: 'GET',
	})

	const status = response.status === 200 ? 'SENT' : 'FAILED'
	await saveMessage({ ...payload, status })
}

export { saveMessage, updateMessage, sendMessage }
