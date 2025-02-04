import { useEffect, useMemo, type ComponentProps } from 'react'
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
import { MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { MemberAttendanceDetailsTable } from './datatable'
import { type MarkAttendanceActionType } from '~/routes/api/mark-attendance/_index'
import type { AttendanceReport, AttendanceData } from '../../model'

interface Props {
	reportDetails?: AttendanceReport
	onClose: () => void
}

interface MainFormProps extends ComponentProps<'form'> {
	onClose?: () => void
	isLoading: boolean
	members: AttendanceData[]
	comment?: string | null
}

export default function AttendanceReportDetails({
	onClose,
	reportDetails,
}: Readonly<Props>) {
	const fetcher = useFetcher<MarkAttendanceActionType>()
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	const title = 'Rapport de présence'

	const membersAttendances = useMemo(() => {
		return reportDetails
			? reportDetails.attendances.map(attendance => ({
					member: { name: attendance.member.name },
					memberId: attendance.memberId,
					inChurch: attendance.inChurch,
					inService: attendance.inService,
				}))
			: []
	}, [reportDetails])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success) {
			onClose?.()
		}
	}, [fetcher.state, fetcher.data, onClose])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						members={membersAttendances}
						comment={reportDetails?.comment}
						isLoading={isSubmitting}
						onClose={onClose}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onClose}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
				</DrawerHeader>
				<MainForm
					className="px-4"
					isLoading={isSubmitting}
					members={membersAttendances}
					comment={reportDetails?.comment}
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
	members,
	comment,
	onClose,
}: Readonly<MainFormProps>) {
	return (
		<div className="space-y-6 max-h-[600px] overflow-y-auto overflow-x-hidden">
			<MemberAttendanceDetailsTable data={members} />

			{comment !== 'undefined' && (
				<div className="flex flex-col space-y-1 border border-gray-200">
					<span className="font-bold text-md">Commentaire</span>
					<div className="max-w-full bg-gray-100 text-wrap max-h-[100px] overflow-y-auto">
						{comment}
					</div>
				</div>
			)}

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
			</div>
		</div>
	)
}
