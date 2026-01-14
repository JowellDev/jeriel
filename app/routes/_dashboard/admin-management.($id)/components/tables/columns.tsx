import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/ui/badge'
import { RiUserUnfollowLine, RiLockPasswordLine } from '@remixicon/react'
import type { AdminUser } from '../../types'
import { TooltipButton } from '~/components/ui/tooltip-button'

interface GetColumnsParams {
	currentUserId: string
	churchAdminId?: string
	onRemoveAdmin: (userId: string, userName: string) => void
	onResetPassword: (userId: string, userName: string) => void
}

export function getColumns({
	currentUserId,
	churchAdminId,
	onRemoveAdmin,
	onResetPassword,
}: GetColumnsParams): ColumnDef<AdminUser>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Nom & prénoms',
			cell: ({ row }) => {
				const { id, name } = row.original
				const isChurchAdmin = id === churchAdminId

				return (
					<div className="flex items-center gap-2">
						<span className="font-medium">{name}</span>
						{isChurchAdmin && (
							<Badge variant="default" className="text-xs">
								Manager principal
							</Badge>
						)}
					</div>
				)
			},
		},
		{
			accessorKey: 'email',
			header: 'Email',
			cell: ({ row }) => {
				const { email } = row.original
				return <span>{email || 'N/D'}</span>
			},
		},
		{
			id: 'actions',
			header: () => <div className="text-center">Actions</div>,
			cell: ({ row }) => {
				const admin = row.original
				const isSelf = admin.id === currentUserId
				const isChurchAdmin = admin.id === churchAdminId

				let title = 'Retirer le rôle administrateur'
				let isDisabled = false

				if (isSelf) {
					title = 'Vous ne pouvez pas retirer votre propre rôle'
					isDisabled = true
				} else if (isChurchAdmin) {
					title = "Le manager principal de l'église ne peut pas être retiré"
					isDisabled = true
				}

				return (
					<div className="flex justify-center gap-2">
						<TooltipButton
							variant="ghost"
							size="icon-sm"
							tooltip="Réinitialiser le mot de passe"
							onClick={() => onResetPassword(admin.id, admin.name)}
							disabled={isChurchAdmin}
						>
							<RiLockPasswordLine size={20} />
						</TooltipButton>

						<TooltipButton
							variant="destructive-ghost"
							size="icon-sm"
							onClick={() => onRemoveAdmin(admin.id, admin.name)}
							disabled={isDisabled}
							tooltip={title}
						>
							<RiUserUnfollowLine size={20} />
						</TooltipButton>
					</div>
				)
			},
		},
	]
}
