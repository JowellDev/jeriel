import { addAssistantSchema, uploadMemberSchema } from '../schema'
import { type ActionFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import { FORM_INTENT } from '../constants'
import invariant from 'tiny-invariant'
import {
	createMember as createHonorFamilyMember,
	uploadHonorFamilyMembers,
	addAssistantToHonorFamily,
	getExportHonorFamilyMembers,
	getHonorFamilyName,
	getUrlParams,
	validateCreateMemberPayload,
} from '../utils/utils.server'
import {
	buildMembersWithAttendances,
	parseExportDateRanges,
} from '~/helpers/attendance.server'
import { createMembersExcelFile } from '~/utils/excel.server'

async function handleUploadIntent(
	formData: FormData,
	churchId: string,
	honorFamilyId: string,
) {
	const submission = await parseWithZod(formData, {
		schema: uploadMemberSchema,
		async: true,
	})

	if (submission.status !== 'success') return submission.reply()

	try {
		await uploadHonorFamilyMembers(
			submission.value.file as File,
			churchId,
			honorFamilyId,
		)
		return { status: 'success' }
	} catch (error: any) {
		return { ...submission.reply(), status: 'error', error: error.cause }
	}
}

async function handleAddAssistantIntent(
	formData: FormData,
	honorFamilyId: string,
) {
	const submission = await parseWithZod(formData, {
		schema: addAssistantSchema,
		async: true,
	})

	if (submission.status !== 'success') return submission.reply()

	await addAssistantToHonorFamily(submission.value, honorFamilyId)

	return { status: 'success' }
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { id: honorFamilyId } = params
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(honorFamilyId, 'honorFamilyId is required')

	if (intent === FORM_INTENT.UPLOAD)
		return handleUploadIntent(formData, currentUser.churchId, honorFamilyId)

	if (intent === FORM_INTENT.ADD_ASSISTANT)
		return handleAddAssistantIntent(formData, honorFamilyId)

	if (intent === FORM_INTENT.EXPORT)
		return exportMembers(request, currentUser, honorFamilyId)

	if (intent === FORM_INTENT.CREATE)
		return createMember(formData, currentUser.churchId, honorFamilyId)

	return { status: 'success' }
}

async function exportMembers(
	request: Request,
	currentUser: Awaited<ReturnType<typeof requireUser>>,
	honorFamilyId: string,
) {
	const filterData = getUrlParams(request)
	const { fromDate, toDate, dateRanges } = parseExportDateRanges(filterData)
	const honorFamily = await getHonorFamilyName(honorFamilyId)

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

async function createMember(
	formData: FormData,
	churchId: string,
	honorFamilyId: string,
) {
	const submission = await validateCreateMemberPayload(formData)

	if (submission.status !== 'success') return submission.reply()

	await createHonorFamilyMember({
		...submission.value,
		churchId,
		honorFamilyId,
	})

	return { status: 'success' }
}

export type ActionType = typeof actionFn
