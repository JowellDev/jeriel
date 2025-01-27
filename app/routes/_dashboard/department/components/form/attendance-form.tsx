import * as React from 'react'
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
import { useFetcher } from '@remix-run/react'
import { type MemberWithRelations } from '~/models/member.model'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { attendanceMarkingSchema } from '../../schema'
import TextAreaField from '~/components/form/textarea-field'
import { type GetAllMembersApiData } from '~/routes/api/get-all-members/_index'
import { type ActionType } from '../../action.server'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MemberAttendanceMarkingTable } from '../attendance-table/attendance-table'

interface Props {
	departmentId: string
	onClose: () => void
}

interface MemberData {
	id: string
	name: string
}

export default function AttendanceForm({
	onClose,
	departmentId,
}: Readonly<Props>) {
	const { load, ...apiFetcher } = useFetcher<GetAllMembersApiData>()
	const fetcher = useFetcher<ActionType>()

	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Liste de présence'

	const [members, setMembers] = useState<MemberData[]>([])

	const updateDepartmentMemberIds = useCallback(
		(members: Array<{ id: string; name: string }>) => {
			setMembers(members.map(({ id, name }) => ({ id, name })))
		},
		[],
	)

	useEffect(() => {
		load(
			`/api/get-all-members?departmentId=${departmentId}&excludeCurrentMember=false`,
		)
	}, [load, departmentId])

	useEffect(() => {
		if (apiFetcher.state === 'idle' && apiFetcher.data) {
			updateDepartmentMemberIds(apiFetcher.data)
		}
	}, [apiFetcher.data, apiFetcher.state, updateDepartmentMemberIds])

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
						fetcher={fetcher}
						members={members}
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
					isLoading={isSubmitting}
					className="px-4"
					fetcher={fetcher}
					members={members}
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
	fetcher,
	members,
	onClose,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	members: MemberData[]
	member?: MemberWithRelations
	fetcher: ReturnType<typeof useFetcher>
	onClose?: () => void
}) {
	const schema = attendanceMarkingSchema

	const membersAttendanceTableData = useMemo(() => {
		return members.map(({ id, name }) => ({
			id,
			name,
			churchAttendance: false,
			serviceAttendance: false,
		}))
	}, [members])

	console.log(
		'membersAttendanceTableData =========>',
		membersAttendanceTableData,
	)

	const [form, fields] = useForm({
		id: 'member-attendance-form',
		constraint: getZodConstraint(schema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
	})

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			className={cn(
				'grid items-start gap-4 mt-4 max-h-[calc(50vh-10px)] overflow-y-auto',
				className,
			)}
		>
			<div className="flex flex-col space-y-4">
				<MemberAttendanceMarkingTable
					data={[
						...membersAttendanceTableData,
						...membersAttendanceTableData,
						...membersAttendanceTableData,
						...membersAttendanceTableData,
					]}
				/>

				<TextAreaField
					label="Commentaire"
					field={fields.comment}
					textareaProps={{ rows: 3 }}
				/>
			</div>
			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value="Enregistrer"
					variant="primary"
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Soumettre
				</Button>
			</div>
		</fetcher.Form>
	)
}
