import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Card, CardContent } from '~/components/ui/card'
import { type MemberWithRelations } from '~/models/member.model'

interface Props {
	member: MemberWithRelations
}

export function GeneralInfosCard({ member }: Readonly<Props>) {
	const location = member.location || 'N/A'
	const birthday = member.birthday
		? format(member.birthday, 'dd/MM/yyyy')
		: 'N/A'

	function getAvatarFallback(name: string): string {
		if (!name) return ''
		const words = name.trim().split(/\s+/)
		const initials = words.map(word => word[0].toUpperCase()).slice(0, 3)
		return initials.join('')
	}

	return (
		<Card className="w-full pt-4">
			<CardContent className="space-y-2 divide-y divide-gray-200 text-[#424242]">
				<div className="flex flex-col items-center space-y-4">
					<Avatar className="w-32 h-32">
						<AvatarImage src={member.pictureUrl ?? ''} alt="avatar" />
						<AvatarFallback className="text-2xl font-semibold">
							{getAvatarFallback(member.name)}
						</AvatarFallback>
					</Avatar>
					<span className="font-semibold text-center">{member.name}</span>
				</div>
				<div className="grid gap-2 pt-4">
					<InfoItem title="📞 Téléphone" value={member.phone} />
					<InfoItem title="🏠 Lieu d’habitation" value={location} />
					<InfoItem title="🗓️ Date de naissance" value={birthday} />
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
