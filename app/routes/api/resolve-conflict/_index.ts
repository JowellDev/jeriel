import { type ActionFunctionArgs } from '@remix-run/node'
import { type z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { resolveConflictSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { prisma } from '~/utils/db.server'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type ResolveConflictData = z.infer<typeof resolveConflictSchema>

export const action = async ({ request }: ActionFunctionArgs) => {
	await requireUser(request)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: resolveConflictSchema,
	})

	if (submission.status !== 'success') return submission.reply()

	try {
		await resolveConflict(submission.value as ResolveConflictData)

		return { status: 'success' }
	} catch (error) {
		return {
			...submission.reply(),
			status: 'error',
			error:
				error instanceof Error
					? error.message
					: 'Une erreur est survenue lors de la résolution du conflit !',
		}
	}
}

async function resolveConflict(data: ResolveConflictData) {
	const {
		memberId,
		tribeAttendanceId,
		departmentAttendanceId,
		presences,
		date,
	} = data

	const parsedPresences = JSON.parse(presences as string) as {
		field: 'tribePresence' | 'departmentPresence'
		value: boolean
	}[]

	const tribePresence = parsedPresences.find(u => u.field === 'tribePresence')
	const departmentPresence = parsedPresences.find(
		u => u.field === 'departmentPresence',
	)

	if (tribePresence?.value !== departmentPresence?.value) {
		throw new Error(
			`Les présences du ${format(date, 'PPPP', { locale: fr })} doivent concorder!`,
		)
	}

	return await prisma.$transaction(async tx => {
		await Promise.all([
			tx.attendance.update({
				where: { id: tribeAttendanceId, memberId, date },
				data: {
					inChurch: tribePresence?.value,
					hasConflict: false,
				},
			}),
			tx.attendance.update({
				where: { id: departmentAttendanceId, memberId, date },
				data: {
					inChurch: departmentPresence?.value,
					hasConflict: false,
				},
			}),
		])
	})
}

export type ResolveConflictActionType = typeof action
