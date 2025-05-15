import { forwardRef } from 'react'
import { Button } from './button'

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

interface TooltipButtonProps
	extends React.ComponentPropsWithoutRef<typeof Button> {
	tooltip: string
	contentClassName?: string
}

const TooltipButton = forwardRef<HTMLButtonElement, TooltipButtonProps>(
	({ tooltip, contentClassName, ...props }, ref) => {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button ref={ref} {...props} />
				</TooltipTrigger>
				<TooltipContent className={contentClassName}>
					<p>{tooltip}</p>
				</TooltipContent>
			</Tooltip>
		)
	},
)

TooltipButton.displayName = 'TooltipButton'

export { TooltipButton }
