import { Info } from 'lucide-react'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '~/components/ui/popover'

interface Props {
	comment: string
}

export function AttendanceComment({ comment }: Readonly<Props>) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button type="button" className="text-inherit leading-none">
					<Info className="size-3 shrink-0" />
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-auto max-w-56 p-2 text-xs whitespace-pre-wrap">
				{comment}
			</PopoverContent>
		</Popover>
	)
}
