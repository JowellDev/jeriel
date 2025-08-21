import type { ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { testBirthdayNotifications } from '~/utils/birthdays.server'

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request)

	if (!user.roles.includes('ADMIN') && !user.roles.includes('SUPER_ADMIN')) {
		return json({ error: 'Non autorisé' }, { status: 403 })
	}

	try {
		await testBirthdayNotifications()
		return json({
			success: true,
			message: "Notifications d'anniversaires envoyées avec succès",
		})
	} catch (error) {
		console.error('Erreur lors du test des notifications:', error)
		return json(
			{ error: "Erreur lors de l'envoi des notifications" },
			{ status: 500 },
		)
	}
}
