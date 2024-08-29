import type { ComponentPropsWithRef, PropsWithChildren } from 'react'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'

interface Props extends ComponentPropsWithRef<typeof Button> {
	loading: boolean
	loadingPosition?: 'left' | 'right'
}

export default function LoadingButton({
	loading,
	children,
	loadingPosition = 'left',
	...props
}: Readonly<PropsWithChildren<Props>>) {
	return (
		<Button {...props}>
			{loading && loadingPosition === 'left' && (
				<ReloadIcon
					role="img"
					className="mr-2 h-4 w-4 animate-spin"
					aria-label="Loading"
				/>
			)}
			{children}
			{loading && loadingPosition === 'right' && (
				<ReloadIcon
					role="img"
					className="mr-2 h-4 w-4 animate-spin"
					aria-label="Loading"
				/>
			)}
		</Button>
	)
}
