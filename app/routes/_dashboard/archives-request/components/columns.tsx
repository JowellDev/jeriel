import { type ColumnDef } from '@tanstack/react-table'
import type { ArchiveRequest } from '../model'
import { format } from 'date-fns'
import { Badge } from '../../../../components/ui/badge'
import { ArchiveRequestStatus } from '~/shared/enum'
import { RiInformationLine } from '@remixicon/react'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'

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
			const isRejected = row.original.status === ArchiveRequestStatus.REJECTED
			const totalArchived = usersToArchive.filter(user => user.deletedAt).length
			const isDone = totalArchived === usersToArchive.length
			const status = isRejected
				? 'Rejetée'
				: isDone
					? 'Archivée'
					: 'En attente'
			const variant = isRejected
				? 'destructive'
				: isDone
					? 'dark-success'
					: 'warning'
			const comment = row.original.comment
			return (
				<div className="flex items-center gap-1.5">
					<Badge variant={variant} className="text-[11px]">
						{status}
					</Badge>
					{isRejected && comment && (
						<Popover>
							<PopoverTrigger
								aria-label="Voir le motif du rejet"
								className="text-muted-foreground hover:text-foreground"
							>
								<RiInformationLine size={16} />
							</PopoverTrigger>
							<PopoverContent className="w-64 text-sm">
								<p className="font-medium mb-1">Motif du rejet</p>
								<p className="text-muted-foreground whitespace-pre-wrap">
									{comment}
								</p>
							</PopoverContent>
						</Popover>
					)}
				</div>
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
		header: 'Actions',
	},
]
