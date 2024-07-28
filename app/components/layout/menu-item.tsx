import { motion } from 'framer-motion'
import type { RemixiconComponentType } from '@remixicon/react'
import { Button } from '../ui/button'
import { cn } from '~/utils/ui'

const variants = {
	open: {
		y: 0,
		opacity: 1,
		transition: {
			y: { stiffness: 1000, velocity: -100 },
		},
	},
	closed: {
		y: 50,
		opacity: 0,
		transition: {
			y: { stiffness: 1000 },
		},
	},
}

export type Props = {
	Icon: RemixiconComponentType
	label: string
}
export const MenuItem = ({ Icon, label }: Props) => {
	return (
		<motion.div
			variants={variants}
			whileHover={{ scale: 0.95 }}
			whileTap={{ scale: 0.9 }}
			className="menu-item"
		>
			<Button
				variant={'menu'}
				className="flex items-center space-x-2 py-2 md:py-5"
			>
				<Icon size={18} />
				<span>{label}</span>
			</Button>
		</motion.div>
	)
}

export const getNavLinkClassName = (isActive: boolean, isPending: boolean) => {
	return cn({
		'pending cursor-progress': isPending,
		'menu-active': isActive,
	})
}
