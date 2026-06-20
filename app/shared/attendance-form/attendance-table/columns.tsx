import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { type z } from 'zod'
import { MemberAvatar } from '~/components/member-avatar'
import { type memberAttendanceSchema } from '~/routes/api/mark-attendance/schema'
import type { AttendanceReportEntity } from '@prisma/client'

export type MemberAttendanceData = z.infer<typeof memberAttendanceSchema> & {
	pictureUrl?: string | null
}

interface ColumnProps {
	hasActiveService: boolean
	entity: AttendanceReportEntity
	onUpdateComment: (memberId: string, comment: string) => void
}

function CommentInput({
	memberId,
	initialValue,
	onUpdateComment,
}: {
	memberId: string
	initialValue?: string | null
	onUpdateComment: (memberId: string, comment: string) => void
}) {
	const [value, setValue] = useState(initialValue ?? '')

	return (
		<input
			type="text"
			placeholder="Optionnel..."
			value={value}
			onChange={e => {
				setValue(e.target.value)
				onUpdateComment(memberId, e.target.value)
			}}
			className="w-full min-w-32 border border-input rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring bg-background"
		/>
	)
}

export function getColumns({
	hasActiveService,
	entity,
	onUpdateComment,
}: ColumnProps): ColumnDef<MemberAttendanceData>[] {
	const commentColumn: ColumnDef<MemberAttendanceData> = {
		accessorKey: 'comment',
		header: () => (
			<div className="text-xs sm:text-sm text-center">Commentaire</div>
		),
		cell: ({ row }) => (
			<CommentInput
				memberId={row.original.memberId}
				initialValue={row.original.comment}
				onUpdateComment={onUpdateComment}
			/>
		),
	}

	const baseColumns: ColumnDef<MemberAttendanceData>[] = [
		{
			accessorKey: 'name',
			header: 'Nom & prénoms',
			cell: ({ row }: { row: { original: MemberAttendanceData } }) => (
				<div className="flex space-x-2 items-center">
					<MemberAvatar
						name={row.original.name}
						pictureUrl={row.original.pictureUrl}
					/>
					<span>{row.original.name}</span>
				</div>
			),
		},
		{
			accessorKey: 'churchAttendance',
			header: () => (
				<div className="flex flex-col divide-y divide-border py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence au culte</p>
				</div>
			),
		},
		commentColumn,
	]

	const meetingColumns: ColumnDef<MemberAttendanceData>[] = [
		{
			accessorKey: 'name',
			header: 'Nom & prénoms',
			cell: ({ row }: { row: { original: MemberAttendanceData } }) => (
				<div className="flex space-x-2 items-center">
					<MemberAvatar
						name={row.original.name}
						pictureUrl={row.original.pictureUrl}
					/>
					<span>{row.original.name}</span>
				</div>
			),
		},
		{
			accessorKey: 'meetingAttendance',
			header: () => (
				<div className="flex flex-col divide-y divide-border py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence à la réunion</p>
				</div>
			),
		},
		commentColumn,
	]

	if (hasActiveService) {
		baseColumns.splice(1, 0, {
			accessorKey: 'serviceAttendance',
			header: () => (
				<div className="flex flex-col divide-y divide-border py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence au service</p>
				</div>
			),
		})
	}

	return entity === 'HONOR_FAMILY' ? meetingColumns : baseColumns
}
