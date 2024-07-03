import type { ComponentPropsWithRef, PropsWithChildren } from 'react'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'

interface Props extends ComponentPropsWithRef<typeof Button> {
	loading: boolean
}

export default function LoadingButton({
	loading,
	children,
	...props
}: Readonly<PropsWithChildren<Props>>) {
	return (
		<Button {...props}>
			{loading && (
				<ReloadIcon
					role="img"
					className="mr-2 h-4 w-4 animate-spin"
					aria-label="Loading"
				/>
			)}
			{children}
		</Button>
	)
}
