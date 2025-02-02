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
import { cn } from '~/utils/ui'
import { MOBILE_WIDTH } from '~/shared/constants'
import { Form, useFetcher } from '@remix-run/react'
import { MemberAttendanceDetailsTable } from './datatable'
import { type MarkAttendanceActionType } from '~/routes/api/mark-attendance/_index'
import { toast } from 'sonner'

interface Props {
	members: any[]
	onClose: () => void
}

interface AttendanceFReportData {
	name: string
	memberId: string
	churchAttendance: boolean
	serviceAttendance: boolean
}

interface MainFormProps extends ComponentProps<'form'> {
	onClose?: () => void
	isLoading: boolean
	members: AttendanceFReportData[]
}

export default function AttendanceReportDetails({
	onClose,
	members,
}: Readonly<Props>) {
	const fetcher = useFetcher<MarkAttendanceActionType>()
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	const title = 'Rapport de présence'

	const membersAttendances = useMemo(() => {
		return members.map(member => {
			return {
				name: member.name,
				memberId: member.id,
				churchAttendance: true,
				serviceAttendance: true,
			}
		})
	}, [members])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data?.success) {
			onClose?.()
			toast.success('Marquage des absences effectué!')
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

	onClose,
}: Readonly<MainFormProps>) {
	return (
		<Form
			method="POST"
			className={cn('grid items-start gap-4 mt-4', className)}
		>
			<div className="space-y-6 max-h-[600px] overflow-y-auto">
				<MemberAttendanceDetailsTable data={members} />
			</div>
			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
			</div>
		</Form>
	)
}
