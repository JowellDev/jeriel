import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ComponentProps,
} from 'react'
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
import { ConflictResolutionTable } from './datatable'
import type { MemberWithAttendancesConflicts } from '../../model/index'
import { type ConflictResolutionData } from './columns'
import { type ResolveConflictActionType } from '~/routes/api/resolve-conflict/_index'
import { getFormProps, type Submission, useForm } from '@conform-to/react'
import { resolveConflictSchema } from '../../schema'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import InputField from '~/components/form/input-field'
import { type z } from 'zod'
import { toast } from 'sonner'

interface Props {
	member?: MemberWithAttendancesConflicts
	onClose: () => void
}

interface MainFormProps extends ComponentProps<'form'> {
	onClose?: () => void
	conflictData?: ConflictResolutionData[]
	fetcher: ReturnType<typeof useFetcher<any>>
}

interface AttendanceUpdate {
	field: 'tribePresence' | 'departmentPresence'
	value: boolean
}

export default function ConflictResolutionForm({
	onClose,
	member,
}: Readonly<Props>) {
	const fetcher = useFetcher<ResolveConflictActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const title = 'Résolution de conflit'

	const conflictData = useMemo(() => {
		const attendances = member?.attendances ?? []
		const tribe = attendances.find(({ report }) => !!report.tribe)

		const department = attendances.find(({ report }) => !!report.department)

		return [
			{
				name: member?.name as string,
				memberId: member?.id as string,
				tribeAttendanceId: tribe?.id as string,
				departmentAttendanceId: department?.id as string,
				date: attendances[0]?.date,
				tribePresence: tribe?.inChurch,
				departmentPresence: department?.inChurch,
				tribeName: tribe?.report.tribe?.name,
				departmentName: department?.report.department?.name,
			},
		]
	}, [member])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data) {
			const { success, message } = fetcher.data
			if (success) {
				toast.success(message)
				onClose?.()
			} else toast.error(message)
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
					aria-describedby="undefined"
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						conflictData={conflictData}
						onClose={onClose}
						fetcher={fetcher}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onClose}>
			<DrawerContent aria-describedby="undefined">
				<DrawerHeader>
					<DrawerTitle>{title}</DrawerTitle>
				</DrawerHeader>
				<MainForm
					className="px-4"
					conflictData={conflictData}
					fetcher={fetcher}
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
	conflictData,
	onClose,
	fetcher,
}: Readonly<MainFormProps>) {
	const [attendanceUpdates, setAttendanceUpdates] = useState<
		AttendanceUpdate[]
	>([
		{ field: 'tribePresence', value: conflictData?.[0].tribePresence ?? false },
		{
			field: 'departmentPresence',
			value: conflictData?.[0].departmentPresence ?? false,
		},
	])

	const [form, fields] = useForm({
		id: 'resolve-conflict-form',
		shouldRevalidate: 'onSubmit',
		constraint: getZodConstraint(resolveConflictSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: resolveConflictSchema })
		},
		defaultValue: {
			memberId: conflictData?.[0].memberId,
			tribeAttendanceId: conflictData?.[0].tribeAttendanceId,
			departmentAttendanceId: conflictData?.[0].departmentAttendanceId,
			date: conflictData?.[0].date.toString(),
		},
		onSubmit(e, { submission }) {
			e.preventDefault()
			handleOnSubmit(submission)
		},
	})

	const handleOnSubmit = useCallback(
		(
			submission: Submission<z.infer<typeof resolveConflictSchema>> | undefined,
		) => {
			if (submission?.status === 'success') {
				const payload = {
					...submission.value,
					presences: JSON.stringify(attendanceUpdates),
				}

				fetcher.submit(payload, {
					method: 'POST',
					action: '/api/resolve-conflict',
				})
			}
		},
		[fetcher, attendanceUpdates],
	)

	const handlePresenceUpdate = useCallback((update: AttendanceUpdate) => {
		setAttendanceUpdates(prev => {
			const index = prev.findIndex(item => item.field === update.field)
			if (index !== -1) {
				const newUpdates = [...prev]
				newUpdates[index] = update
				return newUpdates
			}
			return [...prev, update]
		})
	}, [])

	return (
		<Form
			method="POST"
			{...getFormProps(form)}
			className={cn('grid items-start gap-4 mt-4', className)}
		>
			<div className="space-y-6 max-h-[600px] overflow-y-auto">
				<ConflictResolutionTable
					data={conflictData}
					onUpdateAttendance={handlePresenceUpdate}
				/>
				<InputField field={fields.memberId} InputProps={{ type: 'hidden' }} />
				<InputField
					field={fields.tribeAttendanceId}
					InputProps={{ type: 'hidden' }}
				/>
				<InputField
					field={fields.departmentAttendanceId}
					InputProps={{ type: 'hidden' }}
				/>
				<InputField field={fields.date} InputProps={{ type: 'hidden' }} />
			</div>
			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button type="submit" variant="primary" className="w-full sm:w-auto">
					Soumettre
				</Button>
			</div>
		</Form>
	)
}
