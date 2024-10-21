import LightbulbLineIcon from 'remixicon-react/LightbulbLineIcon'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'

export function Hint({ message }: Readonly<{ message: string }>) {
	return (
		<Popover>
			<PopoverTrigger>
				<LightbulbLineIcon
					className="text-neutral transition-colors hover:text-yellow-500 ml-2"
					size={20}
				/>
			</PopoverTrigger>
			<PopoverContent className="text-xs leading-relaxed" align="start">
				{message}
			</PopoverContent>
		</Popover>
	)
}
