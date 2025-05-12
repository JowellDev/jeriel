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
		cell: ({ row }) => <div className="w-[80px]">{row.original.name}</div>,
	},
	{
		accessorKey: 'phone',
		header: 'Téléphone',
		cell: ({ row }) => row.original.phone,
	},
]
