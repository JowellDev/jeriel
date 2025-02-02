import { type ColumnDef } from '@tanstack/react-table'
import type { ArchiveRequest, User } from '../model'
import TruncateTooltip from '~/components/truncate-tooltip'
import { format } from 'date-fns'
import { Badge } from '../../../../components/ui/badge'

export const archiveRequestColumns: ColumnDef<ArchiveRequest>[] = [
	{
		accessorKey: 'requester.name',
		header: 'Demandeur',
		cell: ({ row }) => (
			<TruncateTooltip text={row.original.requester?.name ?? '-'} />
		),
	},
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
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]

export const archivedUsersColumns: ColumnDef<User>[] = [
	{
		accessorKey: 'name',
		header: 'Nom et prénoms',
		cell: ({ row }) => <TruncateTooltip text={row.original.name} />,
	},
	{
		accessorKey: 'phone',
		header: 'Numéro de téléphone',
		cell: ({ row }) => row.original.phone,
	},
	{
		accessorKey: 'deletedAt',
		header: "Date d'archivage",
		cell: ({ row }) => {
			const { deletedAt } = row.original

			return <span>{deletedAt ? format(deletedAt, 'dd/MM/yyyy') : '-'}</span>
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
