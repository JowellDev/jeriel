import type { Gender } from '@prisma/client'
import {
	RiCakeLine,
	RiDeleteBinLine,
	RiEditLine,
	RiHeart3Line,
	RiMailLine,
	RiMapPin2Line,
	RiPhoneLine,
	RiUser3Line,
	type RemixiconComponentType,
} from '@remixicon/react'
import { format } from 'date-fns'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { type MemberWithRelations } from '~/models/member.model'
import { MaritalStatusValue } from '~/shared/constants'

interface ManagerInfo {
	isManager: boolean
	entities: { type: string; name: string }[]
}

interface Props {
	member: MemberWithRelations
	onEdit: () => void
	onDelete: () => void
	managerInfo: ManagerInfo
}

function formatGender(gender: Gender) {
	return gender === 'F' ? 'Femme' : 'Homme'
}

function getAvatarFallback(name: string): string {
	if (!name) return ''
	return name
		.trim()
		.split(/\s+/)
		.map(word => word[0].toUpperCase())
		.slice(0, 3)
		.join('')
}

export function GeneralInfosCard({
	member,
	onEdit,
	onDelete,
	managerInfo,
}: Readonly<Props>) {
	const gender = member.gender ? formatGender(member.gender) : 'N/D'
	const location = member.location || 'N/D'
	const birthday = member.birthday
		? format(member.birthday, 'dd/MM/yyyy')
		: 'N/D'
	const marital = member.maritalStatus
		? MaritalStatusValue[member.maritalStatus]
		: 'N/D'

	return (
		<Card className="w-full overflow-hidden">
			{/* Bannière */}
			<div className="h-20 bg-gradient-to-br from-primary to-primary/75" />

			<CardContent className="p-4 sm:p-6">
				{/* En-tête profil */}
				<div className="-mt-14 flex flex-col items-center text-center">
					<Avatar className="h-24 w-24 border-4 border-card shadow-sm">
						<AvatarImage src={member.pictureUrl ?? ''} alt={member.name} />
						<AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
							{getAvatarFallback(member.name)}
						</AvatarFallback>
					</Avatar>
					<h2 className="mt-3 text-lg font-bold text-foreground">
						{member.name}
					</h2>
					{managerInfo.isManager && (
						<Badge variant="primary" className="mt-1">
							Responsable
						</Badge>
					)}

					<div className="mt-4 flex w-full gap-2">
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={onEdit}
						>
							<RiEditLine size={16} className="mr-1.5" />
							Modifier
						</Button>
						{!managerInfo.isManager && (
							<Button
								variant="destructive-ghost"
								size="sm"
								className="border border-border"
								onClick={onDelete}
								title="Supprimer le membre"
							>
								<RiDeleteBinLine size={16} />
							</Button>
						)}
					</div>
				</div>

				{/* Appel rapide */}
				{member.phone && (
					<a
						href={`tel:${member.phone}`}
						className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-success-foreground shadow-sm transition-all hover:bg-success/90 active:scale-[0.98]"
					>
						<RiPhoneLine size={18} />
						Appeler
					</a>
				)}

				{/* Informations */}
				<div className="mt-5 space-y-2.5">
					<InfoItem
						Icon={RiPhoneLine}
						label="Téléphone"
						value={member.phone ?? 'N/D'}
					/>
					<InfoItem
						Icon={RiMailLine}
						label="E-mail"
						value={member.email ?? 'N/D'}
					/>
					<InfoItem
						Icon={RiMapPin2Line}
						label="Lieu d'habitation"
						value={location}
					/>
					<InfoItem
						Icon={RiCakeLine}
						label="Date de naissance"
						value={birthday}
					/>
					<InfoItem Icon={RiUser3Line} label="Genre" value={gender} />
					<InfoItem
						Icon={RiHeart3Line}
						label="Situation matrimoniale"
						value={marital}
					/>
				</div>
			</CardContent>
		</Card>
	)
}

function InfoItem({
	Icon,
	label,
	value,
}: Readonly<{
	Icon: RemixiconComponentType
	label: string
	value: string
}>) {
	return (
		<div className="flex min-w-0 items-center gap-3">
			<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
				<Icon size={18} />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-xs text-muted-foreground">{label}</p>
				<p className="truncate text-sm font-medium text-foreground">{value}</p>
			</div>
		</div>
	)
}
