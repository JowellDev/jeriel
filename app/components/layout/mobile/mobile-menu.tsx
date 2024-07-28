import { useRef } from 'react'
import { motion, useCycle, type Variants } from 'framer-motion'
import { MenuToggle } from './menu-toggle'
import { useDimensions } from './use-dimensions'
import { Navigation } from './navigation'
import type { MenuLink } from '../menu-link'

const sidebar: Variants = {
	open: (height = 1000) => ({
		clipPath: `circle(${height * 2 + 200}px at 40px 40px)`,
		transition: {
			type: 'spring',
			stiffness: 20,
			restDelta: 2,
		},
		background: '#226C67',
		zIndex: 10,
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
		zIndex: 0,
	},
}

export const MobileMenu = ({ links }: { links: MenuLink[] }) => {
	const [isOpen, toggleOpen] = useCycle(false, true)
	const containerRef = useRef(null)
	const dm = useDimensions(containerRef)

	return (
		<motion.nav
			initial={false}
			animate={isOpen ? 'open' : 'closed'}
			custom={dm?.height}
			ref={containerRef}
			className="nav-menu"
		>
			<motion.div className="menu-background" variants={sidebar} />
			<Navigation links={links} className={isOpen ? 'z-[16]' : 'z-0'} />
			<MenuToggle toggle={() => toggleOpen()} />
		</motion.nav>
	)
}
