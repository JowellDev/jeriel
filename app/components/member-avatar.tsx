import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { cn } from '~/utils/ui'

interface Props {
	name: string
	pictureUrl?: string | null
	className?: string
}

export function MemberAvatar({ name, pictureUrl, className }: Readonly<Props>) {
	const initials = name
		.split(' ')
		.slice(0, 2)
		.map(s => s[0])
		.join('')
		.toUpperCase()

	return (
		<Avatar className={cn('h-7 w-7 shrink-0', className)}>
			<AvatarImage src={pictureUrl ?? ''} alt={name} />
			<AvatarFallback className="text-[10px] font-medium bg-primary/10 text-primary">
				{initials}
			</AvatarFallback>
		</Avatar>
	)
}
