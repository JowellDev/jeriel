import type { Gender } from '@prisma/client'
import { RiDeleteBinLine, RiEditLine, RiPhoneLine } from '@remixicon/react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Card, CardContent } from '~/components/ui/card'
import { TooltipButton } from '~/components/ui/tooltip-button'
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
	const words = name.trim().split(/\s+/)
	const initials = words.map(word => word[0].toUpperCase()).slice(0, 3)
	return initials.join('')
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

	const deleteTooltip = managerInfo.isManager
		? `Ce membre est responsable de: ${managerInfo.entities.map(e => e.name).join(', ')}`
		: 'Supprimer le membre'

	return (
		<Card className="w-full pt-4">
			<CardContent className="space-y-2 divide-y divide-gray-200 text-[#424242]">
				<div className="flex flex-col items-center space-y-4 relative">
					<Avatar className="w-32 h-32 object-cover border border-gray-200">
						<AvatarImage src={member.pictureUrl ?? ''} alt="avatar" />
						<AvatarFallback className="text-2xl font-semibold">
							{getAvatarFallback(member.name)}
						</AvatarFallback>
					</Avatar>
					<span className="font-semibold text-center">{member.name}</span>
					<div className="absolute right-0 -top-2 flex gap-1">
						<TooltipButton
							tooltip="Modifier les informations"
							variant="outline"
							size="sm"
							onClick={onEdit}
						>
							<RiEditLine size={20} />
						</TooltipButton>
						{!managerInfo.isManager && (
							<TooltipButton
								tooltip={deleteTooltip}
								variant="outline"
								size="sm"
								onClick={onDelete}
								className={
									'text-red-500 hover:text-red-600 hover:border-red-300'
								}
							>
								<RiDeleteBinLine size={20} />
							</TooltipButton>
						)}
					</div>
				</div>
				<div className="grid gap-2 pt-4">
					<PhoneInfoItem phone={member.phone} />
					<InfoItem title="📩 Email" value={member.email ?? 'N/D'} />
					<InfoItem title="🏠 Lieu d'habitation" value={location} />
					<InfoItem title="🗓️ Date de naissance" value={birthday} />
					<InfoItem title="Genre" value={gender} />
					<InfoItem
						title="Situation matrimonial"
						value={
							member.maritalStatus
								? MaritalStatusValue[member.maritalStatus]
								: 'N/D'
						}
					/>
				</div>
			</CardContent>
		</Card>
	)
}

const InfoItem = ({ title, value }: { title: string; value: string }) => {
	return (
		<div className="space-y-1 text-sm">
			<div className="font-semibold">{title}</div>
			<div>{value}</div>
		</div>
	)
}

const PhoneInfoItem = ({ phone }: { phone: string | null }) => {
	return (
		<div className="space-y-1 text-sm">
			<div className="font-semibold">📞 Téléphone</div>
			{phone ? (
				<div className="flex items-center justify-between">
					<span>{phone}</span>
					<a
						href={`tel:${phone}`}
						className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-green-600 active:scale-95 transition-all"
						title="Appeler ce fidèle"
					>
						<RiPhoneLine size={14} />
						Appeler
					</a>
				</div>
			) : (
				<div>N/D</div>
			)}
		</div>
	)
}
