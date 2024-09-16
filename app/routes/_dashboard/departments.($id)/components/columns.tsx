import { type ColumnDef } from '@tanstack/react-table'
import type { Department } from '../model'
import { useRef, useState } from 'react'
import { RiEyeLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import { useVirtualizer } from '@tanstack/react-virtual'

export const columns: ColumnDef<Department>[] = [
	{
		accessorKey: 'name',
		header: 'Nom',
	},
	{
		accessorKey: 'members',
		header: 'Nombre de Membres',
		cell: ({ row }) => <MembersCell members={row.original.members} />,
	},
	{
		accessorKey: 'manager.name',
		header: 'Responsable',
	},
	{
		accessorKey: 'manager.phone',
		header: 'Téléphone',
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]

const MembersCell = ({ members }: { members: Department['members'] }) => {
	const [showMembers, setShowMembers] = useState(false)

	const parentRef = useRef<HTMLDivElement>(null)
	const rowVirtualizer = useVirtualizer({
		count: members.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 50,
	})

	const toggleMembers = () => setShowMembers(!showMembers)

	return (
		<div>
			<div className="flex items-center gap-2">
				<span>{members.length} Membre(s)</span>
				<Button
					variant="primary-ghost"
					size="icon-sm"
					onClick={toggleMembers}
					className="icon-button"
				>
					<RiEyeLine size={16} />
				</Button>
			</div>

			{showMembers && (
				<div
					ref={parentRef}
					className="mt-2 max-h-64 overflow-auto"
					style={{
						position: 'relative',
						height: `${rowVirtualizer.getTotalSize()}px`,
					}}
				>
					{rowVirtualizer.getVirtualItems().map(virtualRow => (
						<div
							key={virtualRow.index}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								transform: `translateY(${virtualRow.start}px)`,
								width: '100%',
							}}
						>
							<div className="p-2 border-b border-gray-200">
								{members[virtualRow.index].name}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
