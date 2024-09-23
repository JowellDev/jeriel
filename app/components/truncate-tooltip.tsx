import { useMediaQuery } from 'usehooks-ts'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { cn } from '~/utils/ui'
import { MOBILE_WIDTH } from '../shared/constants'

interface TruncateTooltipProps {
	text: string
	maxLength?: number
	className?: string
}

export default function TruncateTooltip({
	text,
	maxLength = 20,
	className = '',
}: Readonly<TruncateTooltipProps>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	if (!isDesktop) return <span className={className}>{text}</span>

	const isTruncated = text.length > maxLength
	const displayText = isTruncated ? `${text.slice(0, maxLength)}...` : text

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger
					className={cn('inline-block truncate max-w-full', className)}
				>
					{displayText}
				</TooltipTrigger>
				{isTruncated && (
					<TooltipContent className={cn('max-w-xs', className)} align="start">
						<p className="break-words">{text}</p>
					</TooltipContent>
				)}
			</Tooltip>
		</TooltipProvider>
	)
}
