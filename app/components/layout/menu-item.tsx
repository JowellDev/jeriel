import { motion } from 'framer-motion'
import type { RemixiconComponentType } from '@remixicon/react'

import { cn } from '~/utils/ui'

import { Button } from '../ui/button'

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

const iconAnimation = {
	animate: {
		y: [0, -4, 0],
		transition: {
			duration: 0.9,
			repeat: Infinity,
			ease: 'easeInOut',
		},
	},
}

export type Props = {
	Icon: RemixiconComponentType
	label: string
	hasUnread?: boolean
	hasUnseen?: boolean
	onClick?: () => void
}
export const MenuItem = ({
	Icon,
	label,
	hasUnread,
	hasUnseen,
	onClick,
}: Readonly<Props>) => {
	return (
		<motion.div
			variants={variants}
			whileTap={{ scale: 1 }}
			className="menu-item"
		>
			<Button
				variant={'menu'}
				className="flex items-center space-x-2 py-2 md:py-5"
				onClick={onClick}
			>
				<div className="relative">
					{hasUnseen ? (
						<motion.div animate={iconAnimation.animate}>
							<Icon size={18} />
							<Badge />
						</motion.div>
					) : (
						<>
							<Icon size={18} />
							{hasUnread && <Badge />}
						</>
					)}
				</div>

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

function Badge() {
	return (
		<span className="absolute bottom-3 left-3  h-2 w-2 flex items-center justify-center">
			<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
			<span className="relative inline-flex h-2 w-2 items-center justify-center rounded-full bg-red-500 text-[2px] font-medium text-white"></span>
		</span>
	)
}
