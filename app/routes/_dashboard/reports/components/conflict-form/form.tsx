import { useCallback, useState, useMemo, type ComponentProps } from 'react'
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
import { Form } from '@remix-run/react'
import { ConflictResolutionTable } from './datatable'
import type { MemberWithAttendancesConflicts } from '../../model/index'

interface ConflictResolutionData {
	memberId: string
	name: string
	attendanceId: string
	date: Date | string
	tribePresence: boolean
	departmentPresence: boolean
	tribeName: string | null
	departmentName: string | null
}

interface Props {
	member?: MemberWithAttendancesConflicts
	onClose: () => void
}

interface MainFormProps extends ComponentProps<'form'> {
	onClose?: () => void
	conflictData?: ConflictResolutionData[]
}

export default function ConflictResolutionForm({
	onClose,
	member,
}: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const title = 'Correction de conflit'

	const conflictData = useMemo(() => {
		return (
			member &&
			member?.attendances.map(attendance => ({
				memberId: member.id,
				name: member.name,
				attendanceId: attendance.id,
				date: attendance.date,
				tribePresence:
					attendance.report.entity === 'TRIBE' ? attendance.inChurch : false,
				departmentPresence:
					attendance.report.entity === 'DEPARTMENT'
						? attendance.inChurch
						: false,
				tribeName: attendance.report.tribe?.name ?? null,
				departmentName: attendance.report.department?.name ?? null,
			}))
		)
	}, [member])

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
					<MainForm conflictData={conflictData} onClose={onClose} />
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
				<MainForm className="px-4" conflictData={conflictData} />
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
}: Readonly<MainFormProps>) {
	const [conflicts, setConflicts] = useState(conflictData)

	const handleAttendanceUpdate = useCallback(
		(payload: {
			attendanceId: string
			field: 'tribePresence' | 'departmentPresence'
			value: boolean
		}) => {
			const updatedConflicts = conflicts?.map(conflict => {
				if (conflict.attendanceId === payload.attendanceId) {
					return { ...conflict, [payload.field]: payload.value }
				}
				return conflict
			})
			setConflicts(updatedConflicts)
		},
		[conflicts],
	)

	return (
		<Form
			method="POST"
			className={cn('grid items-start gap-4 mt-4', className)}
		>
			<div className="space-y-6 max-h-[600px] overflow-y-auto">
				<ConflictResolutionTable
					data={conflicts}
					onUpdateAttendance={handleAttendanceUpdate}
				/>
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
