import { type ColumnDef } from '@tanstack/react-table'
import type { ArchiveRequest } from '../model'
import TruncateTooltip from '~/components/truncate-tooltip'

export const archiveRequestColumns: ColumnDef<ArchiveRequest>[] = [
	{
		accessorKey: 'requester.name',
		header: 'Demandeur',
		cell: ({ row }) => <TruncateTooltip text={row.original.requester.name} />,
	},
	{
		accessorKey: 'origin',
		header: 'Provenance',
		cell: ({ row }) => row.original.origin,
	},
	{
		accessorKey: 'usersToArchive',
		header: 'Archivés/Total à archivés',
		cell: ({ row }) => {
			const { usersToArchive } = row.original

			const totalArchived = usersToArchive.filter(user => user.deletedAt).length

			return (
				<span>
					{totalArchived}/{usersToArchive.length}
				</span>
			)
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
