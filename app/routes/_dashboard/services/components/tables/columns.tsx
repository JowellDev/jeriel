import { type ColumnDef } from '@tanstack/react-table'
import type { DepartmentServiceData, TribeServiceData } from '../../types'
import { format } from 'date-fns'

export const tribeTableColumns: ColumnDef<TribeServiceData>[] = [
	{
		accessorKey: 'tribe',
		header: 'Tribu',
		cell: ({ row }) => {
			const { tribe } = row.original
			return <span>{tribe.name}</span>
		},
	},
	{
		header: 'Date de service',
		cell: ({ row }) => {
			const { start, end } = row.original
			const dateFormat = 'dd/MM/yyyy'

			return (
				<span>
					{format(start, dateFormat)} - {format(end, dateFormat)}
				</span>
			)
		},
	},
	{
		header: 'Nom du responsable',
	},
	{
		header: 'Numéro de téléphone',
		cell: ({ row }) => {
			const { tribe } = row.original
			return <span>{tribe.name}</span>
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]

export const departmentTableColumns: ColumnDef<DepartmentServiceData>[] = [
	{
		accessorKey: 'department',
		header: 'Département',
		cell: ({ row }) => {
			const { department } = row.original
			return <span>{department.name}</span>
		},
	},
	{
		header: 'Date de service',
		cell: ({ row }) => {
			const { start, end } = row.original
			const dateFormat = 'dd/MM/yyyy'

			return (
				<span>
					{format(start, dateFormat)} - {format(end, dateFormat)}
				</span>
			)
		},
	},
	{
		header: 'Nom du responsable',
		cell: ({ row }) => {
			const { department } = row.original
			return <span>{department.manager.name}</span>
		},
	},
	{
		header: 'Numéro de téléphone',
		cell: ({ row }) => {
			const { department } = row.original
			return <span>{department.manager.phone}</span>
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
