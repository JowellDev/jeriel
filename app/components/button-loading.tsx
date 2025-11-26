import type { ComponentProps, PropsWithChildren } from 'react'
import { RotateCw } from 'lucide-react'

import { Button } from './ui/button'

type Props = {
	loading?: boolean
} & ComponentProps<typeof Button>

export function ButtonLoading({
	children,
	loading,
	...props
}: Readonly<PropsWithChildren<Props>>) {
	return (
		<Button {...props} disabled={loading || props.disabled}>
			{loading ? <RotateCw className="animate-spin mr-2" /> : null}
			{children}
		</Button>
	)
}
