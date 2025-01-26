import { type ColumnDef } from '@tanstack/react-table'
import type { ArchiveRequest, User } from '../model'
import TruncateTooltip from '~/components/truncate-tooltip'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const archiveRequestColumns: ColumnDef<ArchiveRequest>[] = [
	{
		accessorKey: 'requester.name',
		header: 'Demandeur',
		cell: ({ row }) => (
			<TruncateTooltip text={row.original.requester?.name ?? '-'} />
		),
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
		accessorKey: 'createdAt',
		header: 'Date de la demande',
		cell: ({ row }) => {
			const { createdAt } = row.original

			return (
				<span>
					{createdAt
						? format(createdAt, 'dd/MM/yyyy à HH:mm', { locale: fr })
						: '-'}
				</span>
			)
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
		cell: ({ row }) => <div className="w-[80px]">{row.original.name}</div>,
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

			return (
				<span>
					{deletedAt
						? format(deletedAt, 'dd/MM/yyyy à HH:mm', { locale: fr })
						: '-'}
				</span>
			)
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
