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
import type { AttendanceReport, AttendanceData, EntityType } from '../../model'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
	reportDetails?: AttendanceReport
	onClose: () => void
	entity?: EntityType
}

interface MainFormProps extends ComponentProps<'form'> {
	onClose?: () => void
	members: AttendanceData[]
	comment?: string | null
	entity?: EntityType
}

export default function AttendanceReportDetails({
	onClose,
	reportDetails,
	entity,
}: Readonly<Props>) {
	const fetcher = useFetcher<MarkAttendanceActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	const title = 'Rapport de présence'

	const membersAttendances = useMemo(() => {
		return reportDetails
			? reportDetails.attendances.map(attendance => ({
					member: { name: attendance.member.name },
					memberId: attendance.memberId,
					inChurch: attendance.inChurch,
					inService: attendance.inService,
					inMeeting: attendance.inMeeting,
					date: attendance.date,
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
					showCloseButton={false}
				>
					<DialogHeader className="flex flex-row items-center justify-between">
						<DialogTitle className="w-fit">{title}</DialogTitle>

						{reportDetails?.attendances[0]?.date && (
							<div className="capitalize font-semibold p-2 rounded-sm bg-gray-100">
								{format(reportDetails?.attendances[0].date, 'PPPP', {
									locale: fr,
								})}
							</div>
						)}
					</DialogHeader>
					<MainForm
						members={membersAttendances}
						comment={reportDetails?.comment}
						entity={entity}
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
					{reportDetails?.attendances[0].date && (
						<div className="capitalize text-sm font-semibold p-1 rounded-sm bg-gray-100">
							{format(reportDetails?.attendances[0].date, 'dd/MM/yyyy', {
								locale: fr,
							})}
						</div>
					)}
				</DrawerHeader>
				<MainForm
					className="px-4"
					entity={entity}
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
	members,
	comment,
	onClose,
	entity,
}: Readonly<MainFormProps>) {
	return (
		<div className="space-y-6 max-h-[600px] overflow-y-auto overflow-x-hidden">
			<MemberAttendanceDetailsTable data={members} entity={entity} />

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
