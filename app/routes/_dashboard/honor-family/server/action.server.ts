import {
	addAssistantSchema,
	createMemberSchema,
	uploadMemberSchema,
} from '../schema'
import { type ActionFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import { FORM_INTENT } from '../constants'
import invariant from 'tiny-invariant'
import {
	addAssistantToHonorFamily,
	createMember,
	getExportHonorFamilyMembers,
	getHonorFamilyName,
	getUrlParams,
	superRefineHandler,
	uploadHonorFamilyMembers,
} from '../utils/utils.server'
import { notifyAdminForAddedMemberInEntity } from '~/helpers/notification.server'
import { appLogger } from '~/helpers/logging'
import {
	fetchAttendanceData,
	prepareDateRanges,
} from '~/helpers/attendance.server'
import { getMembersAttendances } from '~/shared/attendance'
import { createMembersExcelFile } from '~/utils/excel.server'
import { parseISO } from 'date-fns'

const logger = appLogger.child({ module: 'honor-family-action' })

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { honorFamilyId, churchId } = currentUser

	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(churchId, 'Invalid churchId')
	invariant(honorFamilyId, 'honorFamilyId is required')

	if (intent === FORM_INTENT.EXPORT) {
		return exportMembers(request, currentUser, honorFamilyId)
	}

	if (intent === FORM_INTENT.CREATE) {
		const submission = await parseWithZod(formData, {
			schema: createMemberSchema.superRefine((fields, ctx) =>
				superRefineHandler(fields, ctx),
			),
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		const { value } = submission

		const member = await createMember(value, churchId, honorFamilyId)

		await notifyAdminForAddedMemberInEntity({
			memberName: member.name,
			entity: 'HONOR_FAMILY',
			entityId: honorFamilyId,
			churchId,
			managerId: currentUser.id,
		})

		return { status: 'success' }
	}

	if (intent === FORM_INTENT.UPLOAD) {
		const submission = await parseWithZod(formData, {
			schema: uploadMemberSchema,
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		const { file } = submission.value

		invariant(file, 'File is required')

		try {
			await uploadHonorFamilyMembers(file, churchId, honorFamilyId)

			return { status: 'success' }
		} catch (error: any) {
			logger.error('Error uploading members', {
				extra: {
					error,
					honorFamilyId,
					churchId,
					fileName: file.name,
				},
			})

			return {
				...submission.reply(),
				status: 'error',
				message: error.cause,
			}
		}
	}

	if (intent === FORM_INTENT.ADD_ASSISTANT) {
		const submission = await parseWithZod(formData, {
			schema: addAssistantSchema,
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		const { value } = submission

		await addAssistantToHonorFamily(value, honorFamilyId)

		return { status: 'success' }
	}

	return { status: 'success' }
}

export type ActionType = typeof actionFn

function parseExportDates(filterData: ReturnType<typeof getUrlParams>) {
	const fromDate = parseISO(filterData.from)
	const toDate = parseISO(filterData.to)
	const dateRanges = prepareDateRanges(toDate)
	return { fromDate, toDate, dateRanges }
}

async function buildMembersWithAttendances(
	currentUser: Awaited<ReturnType<typeof requireUser>>,
	members: Awaited<ReturnType<typeof getExportHonorFamilyMembers>>,
	fromDate: Date,
	dateRanges: ReturnType<typeof prepareDateRanges>,
) {
	const memberIds = members.map(m => m.id)
	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		currentUser,
		memberIds,
		fromDate,
		dateRanges.toDate,
		dateRanges.previousFrom,
		dateRanges.previousTo,
	)
	return getMembersAttendances(
		members,
		dateRanges.currentMonthSundays,
		dateRanges.previousMonthSundays,
		allAttendances,
		previousAttendances,
	)
}

async function exportMembers(
	request: Request,
	currentUser: Awaited<ReturnType<typeof requireUser>>,
	honorFamilyId: string,
) {
	const filterData = getUrlParams(request)
	const honorFamily = await getHonorFamilyName(honorFamilyId)
	const { fromDate, toDate, dateRanges } = parseExportDates(filterData)
	currentUser.honorFamilyId = honorFamilyId
	const members = await getExportHonorFamilyMembers({
		id: honorFamilyId,
		filterData,
	})
	const membersWithAttendances = await buildMembersWithAttendances(
		currentUser,
		members,
		fromDate,
		dateRanges,
	)
	const fileName = `Membres de la famille d'Honneur ${honorFamily?.name}`
	const fileLink = await createMembersExcelFile(
		membersWithAttendances,
		toDate,
		fileName,
	)
	return { status: 'success', fileLink: '/' + fileLink }
}
