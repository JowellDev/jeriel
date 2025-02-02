import { type ColumnDef } from '@tanstack/react-table'
import type { ArchiveRequest } from '../model'
import { format } from 'date-fns'
import { Badge } from '../../../../components/ui/badge'

export const archiveRequestColumns: ColumnDef<ArchiveRequest>[] = [
	{
		accessorKey: 'origin',
		header: 'Origine',
		cell: ({ row }) => {
			const { origin } = row.original
			return <span>{origin}</span>
		},
	},
	{
		accessorKey: 'usersToArchive',
		header: 'Membres à archiver',
		cell: ({ row }) => {
			const { usersToArchive } = row.original
			const totalArchived = usersToArchive.filter(user => user.deletedAt).length
			return (
				<span>
					<span className="text">{totalArchived} / </span>
					<span className="text-lg">{usersToArchive.length}</span>
				</span>
			)
		},
	},
	{
		accessorKey: 'status',
		header: 'Statut',
		cell: ({ row }) => {
			const { usersToArchive } = row.original
			const totalArchived = usersToArchive.filter(user => user.deletedAt).length
			const isDone = totalArchived === usersToArchive.length
			const status = isDone ? 'Archivée' : 'En attente'
			return (
				<Badge
					variant={isDone ? 'dark-success' : 'warning'}
					className="text-[11px]"
				>
					{status}
				</Badge>
			)
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Date de la demande',
		cell: ({ row }) => {
			const { createdAt } = row.original
			return <span>{createdAt ? format(createdAt, 'dd/MM/yyyy') : '-'}</span>
		},
	},
]
