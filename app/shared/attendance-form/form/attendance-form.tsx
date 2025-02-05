import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ComponentProps,
} from 'react'
import { type z } from 'zod'
import { useMediaQuery } from 'usehooks-ts'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '~/components/ui/drawer'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import { MOBILE_WIDTH } from '~/shared/constants'
import { Form, useFetcher } from '@remix-run/react'
import { type Submission, getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import TextAreaField from '~/components/form/textarea-field'
import { MemberAttendanceMarkingTable } from '../attendance-table/attendance-table'
import { attendanceMarkingSchema } from '~/routes/api/mark-attendance/schema'
import { type MarkAttendanceActionType } from '~/routes/api/mark-attendance/_index'
import InputField from '~/components/form/input-field'
import { type AttendanceReportEntity } from '@prisma/client'
import { toast } from 'sonner'
import { DatePicker } from '~/components/form/date-picker'
import type { AttendanceScope, Services } from '../attendance-table/types'
import { hasActiveServiceForDate } from '~/utils/date'

interface Props {
	members: any[]
	onClose: () => void
	entity: AttendanceReportEntity
	entityIds: {
		tribeId?: string
		departmentId?: string
		honorFamilyId?: string
	}
	services?: Services[]
}

interface MemberAttendanceData {
	name: string
	memberId: string
	churchAttendance: boolean
	serviceAttendance: boolean
	meetingAttendance: boolean
}

interface MainFormProps extends ComponentProps<'form'> {
	onClose?: () => void
	isLoading: boolean
	members: MemberAttendanceData[]
	fetcher: ReturnType<typeof useFetcher<any>>
	entity: AttendanceReportEntity
	entityIds: {
		tribeId?: string
		departmentId?: string
		honorFamilyId?: string
	}
	currentDay: Date
	hasActiveService: boolean
}

export default function AttendanceForm({
	onClose,
	entity,
	members,
	entityIds,
	services,
}: Readonly<Props>) {
	const fetcher = useFetcher<MarkAttendanceActionType>()
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const title = 'Liste de présence'
	const [date, setDate] = useState<Date | undefined>()
	const { honorFamilyId, tribeId, departmentId } = entityIds
	const [hasActiveService, setHasActiveService] = useState(false)

	useEffect(() => {
		if (services) {
			const isActive = hasActiveServiceForDate(date ?? new Date(), services)
			setHasActiveService(isActive)
		}
	}, [services, date])

	const membersAttendances = useMemo(() => {
		return members.map(member => {
			return {
				name: member.name,
				memberId: member.id,
				churchAttendance:
					tribeId || departmentId ? true : member.churchAttendance,
				serviceAttendance:
					(tribeId || departmentId) && hasActiveService
						? true
						: member.serviceAttendance,
				meetingAttendance: honorFamilyId ? true : member.meetingAttendance,
			}
		})
	}, [departmentId, hasActiveService, honorFamilyId, members, tribeId])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data) {
			const { success, message } = fetcher.data
			if (success) toast.success(message)
			else toast.error(message)
			onClose?.()
		}
	}, [fetcher.data, fetcher.state, onClose])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
					showCloseButton={false}
				>
					<DialogHeader className="flex flex-row items-center justify-between">
						<DialogTitle className="w-fit">{title}</DialogTitle>

						<DatePicker selectedDate={date} onSelectDate={setDate} />
					</DialogHeader>
					<MainForm
						members={membersAttendances}
						isLoading={isSubmitting}
						fetcher={fetcher}
						entity={entity}
						entityIds={entityIds}
						currentDay={date ?? new Date()}
						hasActiveService={hasActiveService}
						onClose={onClose}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onClose}>
			<DrawerContent>
				<DrawerHeader className="flex items-center justify-between">
					<DrawerTitle className="text-sm ">{title}</DrawerTitle>
					<DatePicker
						selectedDate={date}
						onSelectDate={setDate}
						className="text-xs p-1"
						isDesktop={true}
					/>
				</DrawerHeader>
				<MainForm
					className="px-4"
					entity={entity}
					fetcher={fetcher}
					entityIds={entityIds}
					isLoading={isSubmitting}
					currentDay={date ?? new Date()}
					hasActiveService={hasActiveService}
					members={membersAttendances}
				/>
				<DrawerFooter className="pt-2">
					<DrawerClose asChild>
						<Button variant="outline">Fermer</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}

function MainForm({
	className,
	isLoading,
	members,
	fetcher,
	entity,
	entityIds,
	onClose,
	currentDay,
	hasActiveService,
}: Readonly<MainFormProps>) {
	const [attendances, setAttendances] = useState(members)

	const [form, fields] = useForm({
		id: 'member-attendance-form',
		constraint: getZodConstraint(attendanceMarkingSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: attendanceMarkingSchema })
		},
		defaultValue: {
			entity,
			...entityIds,
			date: currentDay.toDateString(),
		},
		onSubmit(e, { submission }) {
			e.preventDefault()
			handleOnSubmit(submission)
		},
	})

	const handleOnSubmit = useCallback(
		(
			submission:
				| Submission<z.infer<typeof attendanceMarkingSchema>>
				| undefined,
		) => {
			if (submission?.status === 'success') {
				const payload = {
					...submission.value,
					attendances: JSON.stringify(attendances),
				}

				fetcher.submit(payload, {
					method: 'POST',
					action: '/api/mark-attendance',
				})
			}
		},
		[attendances, fetcher],
	)

	const handleAttendanceUpdate = useCallback(
		(payload: {
			memberId: string
			isPresent: boolean
			scope: AttendanceScope
		}) => {
			const currentMember = attendances.find(
				member => member.memberId === payload.memberId,
			) as MemberAttendanceData

			currentMember[
				payload.scope === 'church'
					? 'churchAttendance'
					: payload.scope === 'service'
						? 'serviceAttendance'
						: 'meetingAttendance'
			] = payload.isPresent

			setAttendances([...attendances])
		},
		[attendances],
	)

	return (
		<Form
			{...getFormProps(form)}
			method="POST"
			className={cn('grid items-start gap-4 mt-4', className)}
		>
			<div className="space-y-6 max-h-[600px] overflow-y-auto">
				<MemberAttendanceMarkingTable
					data={attendances}
					onUpdateAttendance={handleAttendanceUpdate}
					entity={entity}
					hasActiveService={hasActiveService}
				/>
				<div className="flex flex-col space-y-4 items-center">
					<TextAreaField
						label="Commentaire"
						field={fields.comment}
						textareaProps={{ rows: 3 }}
					/>
					<InputField
						field={fields.departmentId}
						InputProps={{ type: 'hidden' }}
					/>
					<InputField
						field={fields.date}
						InputProps={{ type: 'hidden' }}
						withError={false}
					/>
					<InputField
						field={fields.tribeId}
						InputProps={{ type: 'hidden' }}
						withError={false}
					/>
					<InputField
						field={fields.honorFamilyId}
						InputProps={{ type: 'hidden' }}
						withError={false}
					/>
					<InputField
						field={fields.entity}
						InputProps={{ type: 'hidden' }}
						withError={false}
					/>
				</div>
			</div>
			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					variant="primary"
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Soumettre
				</Button>
			</div>
		</Form>
	)
}
