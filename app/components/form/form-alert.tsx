import { RiErrorWarningLine, RiInformationLine } from '@remixicon/react'
import { Alert, AlertTitle, AlertDescription } from '../ui/alert'

export function FormAlert({
	variant,
	message,
}: Readonly<{
	variant: 'info' | 'destructive'
	message: string
}>) {
	return (
		<Alert variant={variant}>
			{variant === 'destructive' ? (
				<RiErrorWarningLine className="h-4 w-4" />
			) : (
				<RiInformationLine className="h-4 w-4" />
			)}
			<AlertTitle className="font-semibold">
				{variant === 'destructive' ? 'Erreur' : 'Information'}
			</AlertTitle>
			<AlertDescription>{message}</AlertDescription>
		</Alert>
	)
}
