import { useMediaQuery } from 'usehooks-ts'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
} from '~/components/ui/drawer'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { MOBILE_WIDTH } from '~/shared/constants'
import type { BirthdayMember } from '../types'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { format } from 'date-fns'

interface Props {
	member: BirthdayMember
	onClose: () => void
}

const InfoItem = ({ title, value }: { title: string; value: string }) => {
	return (
		<div className="space-y-1 text-sm">
			<div className="font-semibold">{title}</div>
			<div>{value}</div>
		</div>
	)
}

export function BirthdayMemberDetails({ member, onClose }: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const birthday = member.birthday
		? format(member.birthday, 'dd/MM/yyyy')
		: 'N/D'

	function getAvatarFallback(name: string): string {
		if (!name) return ''
		const words = name.trim().split(/\s+/)
		const initials = words.map(word => word[0].toUpperCase()).slice(0, 3)
		return initials.join('')
	}

	const content = (
		<div className="p-4 border border-gray-300">
			<div className="flex flex-col items-center space-y-4 relative border-b">
				<Avatar className="w-56 h-56 object-cover border border-gray-200">
					<AvatarImage src={member.pictureUrl ?? ''} alt="avatar" />
					<AvatarFallback className="text-2xl font-semibold">
						{getAvatarFallback(member.name)}
					</AvatarFallback>
				</Avatar>
				<span className="font-semibold text-center">{member.name}</span>
			</div>

			<div className="grid grid-cols-2 gap-2 pt-4">
				<InfoItem title="📞 Téléphone" value={member.phone ?? 'N/D'} />
				<InfoItem
					title="🏠 Lieu d’habitation"
					value={member.location ?? 'N/D'}
				/>
				<InfoItem title="🗓️ Date de naissance" value={birthday} />
				<InfoItem title="Genre" value={member.gender} />
			</div>
		</div>
	)

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="p-4 w-fit"
					onOpenAutoFocus={e => e.preventDefault()}
					showCloseButton={false}
				>
					{content}
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onClose}>
			<DrawerContent className="p-2">
				{content}
				<DrawerFooter className="pt-2">
					<DrawerClose asChild>
						<Button variant="outline">Fermer</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
