import { type ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '~/components/ui/checkbox'
import { MemberAvatar } from '~/components/member-avatar'
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
				disabled={!!row.original.deletedAt}
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
		cell: ({ row }) => (
			<div className="flex space-x-2 items-center">
				<MemberAvatar
					name={row.original.name}
					pictureUrl={row.original.pictureUrl}
				/>
				<span>{row.original.name}</span>
			</div>
		),
	},
	{
		accessorKey: 'phone',
		header: 'Téléphone',
		cell: ({ row }) => row.original.phone,
	},
]
