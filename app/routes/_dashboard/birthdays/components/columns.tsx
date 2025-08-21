import { type ColumnDef } from '@tanstack/react-table'
import type { BirthdayMember } from '../types'
import { format } from 'date-fns'

export const columns: ColumnDef<BirthdayMember>[] = [
	{
		header: 'Nom et prénoms',
		cell: ({ row }) => {
			const { name } = row.original

			return (
				<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
					{name}
				</div>
			)
		},
	},
	{
		header: 'Date de naissance',
		cell: ({ row }) => {
			const { birthday } = row.original

			return (
				<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
					{format(new Date(birthday), 'dd/MM/yyyy')}
				</div>
			)
		},
	},
	{
		accessorKey: 'phone',
		header: 'Téléphone',
		cell: ({ row }) => {
			const { phone } = row.original

			return (
				<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
					{phone}
				</div>
			)
		},
	},
	{
		header: 'Tribu',
		cell: ({ row }) => {
			const { tribeName } = row.original

			return (
				<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
					{tribeName || 'N/A'}
				</div>
			)
		},
	},
	{
		header: "Famille d'honneur",
		cell: ({ row }) => {
			const { honorFamilyName } = row.original

			return (
				<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
					{honorFamilyName || 'N/A'}
				</div>
			)
		},
	},
	{
		header: 'Département',
		cell: ({ row }) => {
			const { departmentName } = row.original

			return (
				<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
					{departmentName || 'N/A'}
				</div>
			)
		},
	},
]
