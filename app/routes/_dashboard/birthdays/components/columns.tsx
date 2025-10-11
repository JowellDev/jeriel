import { type ColumnDef } from '@tanstack/react-table'
import type { BirthdayMember, EntityType } from '../types'
import { format } from 'date-fns'

export function getColumns(
	entityType: EntityType,
	canSeeAll: boolean,
): ColumnDef<BirthdayMember>[] {
	const baseColumns: ColumnDef<BirthdayMember>[] = [
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
	]

	const entityColumns: ColumnDef<BirthdayMember>[] = [
		{
			header: 'Tribu',
			cell: ({ row }) => {
				const { tribeName } = row.original
				return (
					<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
						{tribeName || 'N/D'}
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
						{honorFamilyName || 'N/D'}
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
						{departmentName || 'N/D'}
					</div>
				)
			},
		},
	]

	const actionsColumn: ColumnDef<BirthdayMember> = {
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	}

	const visibleEntityColumns = canSeeAll
		? entityColumns
		: entityColumns.filter(col => {
				if (entityType === 'TRIBE' && col.header === 'Tribu') return false
				if (entityType === 'HONOR_FAMILY' && col.header === "Famille d'honneur")
					return false
				if (entityType === 'DEPARTMENT' && col.header === 'Département')
					return false
				return true
			})

	return [...baseColumns, ...visibleEntityColumns, actionsColumn]
}
