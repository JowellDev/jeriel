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
		meta: { className: 'w-1/2' },
		cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
	},
	{
		accessorKey: 'phone',
		header: 'Téléphone',
		meta: { className: 'whitespace-nowrap' },
		cell: ({ row }) => row.original.phone || 'N/D',
	},
]
