import React from 'react'
import { Button } from '~/components/ui/button'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { MemberTable } from './member-table'

interface TableContentProps {
	data: MemberMonthlyAttendances[]
	departmentId: string
	total: number
	onShowMore: () => void
}

export const TableContent: React.FC<TableContentProps> = React.memo(
	({ data, departmentId, total, onShowMore }) => (
		<>
			<MemberTable data={data} departmentId={departmentId} />
			<div className="flex justify-center">
				<Button
					size="sm"
					type="button"
					variant="ghost"
					className="bg-neutral-200 rounded-full"
					disabled={data.length === total}
					onClick={onShowMore}
				>
					Voir plus
				</Button>
			</div>
		</>
	),
)

TableContent.displayName = 'TableContent'
