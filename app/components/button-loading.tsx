import type { ComponentProps, PropsWithChildren } from 'react'
import { Button } from './ui/button'
import { RotateCw } from 'lucide-react'
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
