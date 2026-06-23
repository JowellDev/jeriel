import { type ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '~/components/ui/checkbox'
import { type User } from '../model'

export const usersToArchiveColumns: ColumnDef<User>[] = [
	{
		id: 'select',
		accessorKey: 'id',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && 'indeterminate')
				}
				onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
				className="translate-y-[2px]"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				disabled={!!row.original.deletedAt} // Disable if deletedAt is defined
				onCheckedChange={value =>
					row.toggleSelected(!!value, { selectChildren: true })
				}
				aria-label="Select row"
				className="translate-y-[2px]"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'name',
		header: 'Nom et prénoms',
		meta: { className: 'w-full' },
		cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
	},
	{
		accessorKey: 'phone',
		header: () => <div className="text-right">Téléphone</div>,
		meta: { className: 'text-right whitespace-nowrap' },
		cell: ({ row }) => (
			<div className="text-right">{row.original.phone || 'N/D'}</div>
		),
	},
]
