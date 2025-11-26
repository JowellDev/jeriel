import { useRef } from 'react'
import { motion, useCycle, type Variants } from 'framer-motion'

import type { MenuLink } from '../menu-link'

import { MenuToggle } from './menu-toggle'
import { useDimensions } from './use-dimensions'
import { Navigation } from './navigation'

const sidebar: Variants = {
	open: (height = 1000) => ({
		clipPath: `circle(${height * 2 + 200}px at 40px 40px)`,
		transition: {
			type: 'spring',
			stiffness: 20,
			restDelta: 2,
		},
		background: '#226C67',
	}),
	closed: {
		clipPath: 'circle(20px at 40px 40px)',
		transition: {
			delay: 0.3,
			type: 'spring',
			stiffness: 400,
			damping: 40,
		},
		background: 'transparent',
	},
}

interface Props {
	links: MenuLink[]
	hasUnread?: boolean
	hasUnseen?: boolean
}

export const MobileMenu = ({
	links,
	hasUnseen,
	hasUnread,
}: Readonly<Props>) => {
	const [isOpen, toggleOpen] = useCycle(false, true)
	const containerRef = useRef(null)
	const dm = useDimensions(containerRef)

	return (
		<>
			<motion.nav
				initial={false}
				animate={isOpen ? 'open' : 'closed'}
				custom={dm?.height}
				ref={containerRef}
				className={`nav-menu ${!isOpen ? '-z-[50]' : 'z-[10]'}`}
			>
				<motion.div className="menu-background" variants={sidebar} />
				<Navigation
					links={links}
					className=""
					hasUnread={hasUnread}
					hasUnseen={hasUnseen}
					onClick={() => toggleOpen()}
				/>
			</motion.nav>
			<MenuToggle
				toggle={() => toggleOpen()}
				isOpen={isOpen}
				clasName="z-[30]"
			/>
		</>
	)
}
