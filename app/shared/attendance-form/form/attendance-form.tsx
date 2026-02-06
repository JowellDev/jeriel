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
	DialogClose,
	DialogContent,
	DialogFooter,
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
import { type AttendanceReportEntity } from '@prisma/client'
import { toast } from 'sonner'
import { DatePicker } from '~/components/form/date-picker'
import type { AttendanceScope, Services } from '../attendance-table/types'
import { hasActiveServiceForDate } from '~/utils/date'
import { ButtonLoading } from '~/components/button-loading'
import { Input } from '~/components/ui/input'

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
	serviceAttendance?: boolean
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
	currentDay?: Date
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
		if (services && date) {
			const isActive = hasActiveServiceForDate(date, services)
			setHasActiveService(isActive)
		}
	}, [services, date])

	const membersAttendances = useMemo(() => {
		return members.map(member => ({
			name: member.name,
			memberId: member.id,
			churchAttendance:
				tribeId || departmentId ? true : member.churchAttendance,
			serviceAttendance:
				(tribeId || departmentId) && hasActiveService
					? true
					: member.serviceAttendance,
			meetingAttendance: honorFamilyId ? true : member.meetingAttendance,
		}))
	}, [departmentId, hasActiveService, honorFamilyId, members, tribeId])

	function handleSelectDate(date?: Date) {
		if (date) setDate(date)
	}

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
						<DatePicker selectedDate={date} onSelectDate={handleSelectDate} />
					</DialogHeader>
					{date ? (
						<MainForm
							hasActiveService={hasActiveService}
							members={membersAttendances}
							isLoading={isSubmitting}
							fetcher={fetcher}
							entity={entity}
							entityIds={entityIds}
							currentDay={date}
							onClose={onClose}
						/>
					) : (
						<>
							<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
								<p>
									Veuillez sélectionner une date pour afficher le formulaire
								</p>
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button variant="outline">Fermer</Button>
								</DialogClose>
							</DialogFooter>
						</>
					)}
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
						onSelectDate={handleSelectDate}
						className="text-xs p-1"
						isDesktop={true}
					/>
				</DrawerHeader>
				{date ? (
					<MainForm
						className="px-4"
						entity={entity}
						fetcher={fetcher}
						entityIds={entityIds}
						isLoading={isSubmitting}
						currentDay={date}
						hasActiveService={hasActiveService}
						members={membersAttendances}
					/>
				) : (
					<div className="flex flex-col items-center justify-center py-12 px-4 text-muted-foreground">
						<p className="text-sm text-center">
							Veuillez sélectionner une date pour afficher le formulaire
						</p>
					</div>
				)}
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
		shouldRevalidate: 'onInput',
		constraint: getZodConstraint(attendanceMarkingSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: attendanceMarkingSchema })
		},
		defaultValue: {
			entity,
			...entityIds,
			date: currentDay?.toDateString(),
		},
		onSubmit(e, { submission }) {
			e.preventDefault()
			handleOnSubmit(submission)
		},
	})

	useEffect(() => {
		if (currentDay) {
			form.update({ name: 'date', value: currentDay.toDateString() })
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentDay])

	const handleOnSubmit = useCallback(
		(
			submission:
				| Submission<z.infer<typeof attendanceMarkingSchema>>
				| undefined,
		) => {
			if (submission?.status === 'success') {
				const { comment, ...rest } = submission.value
				const payload = {
					...rest,
					...(comment != null && { comment }),
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

	useEffect(() => {
		if (hasActiveService !== undefined) {
			const updatedData = attendances.map(attendance => {
				return {
					...attendance,
					serviceAttendance: hasActiveService || undefined,
				}
			})

			const needsUpdate = updatedData.some(
				(item, index) =>
					item.serviceAttendance !== attendances[index].serviceAttendance,
			)

			if (needsUpdate) {
				setAttendances(updatedData)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasActiveService])

	return (
		<Form
			{...getFormProps(form)}
			method="POST"
			className={cn('grid items-start gap-4 mt-4', className)}
		>
			<div className="space-y-6 max-h-[600px] overflow-y-auto px-1 pb-4">
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
					<Input
						id={fields.departmentId.id}
						name={fields.departmentId.name}
						defaultValue={fields.departmentId.value}
						type="hidden"
					/>

					<Input
						id={fields.tribeId.id}
						name={fields.tribeId.name}
						defaultValue={fields.tribeId.value}
						type="hidden"
					/>

					<Input
						id={fields.honorFamilyId.id}
						name={fields.honorFamilyId.name}
						defaultValue={fields.honorFamilyId.value}
						type="hidden"
					/>

					<Input
						id={fields.entity.id}
						name={fields.entity.name}
						defaultValue={fields.entity.value}
						type="hidden"
					/>

					<Input
						id={fields.date.id}
						name={fields.date.name}
						defaultValue={fields.date.value}
						type="hidden"
					/>
				</div>
			</div>
			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<ButtonLoading
					type="submit"
					variant="primary"
					loading={isLoading}
					className="w-full sm:w-auto"
				>
					Soumettre
				</ButtonLoading>
			</div>
		</Form>
	)
}
