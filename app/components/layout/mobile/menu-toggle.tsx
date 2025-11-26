import * as React from 'react'
import { RiCloseLargeFill, RiMenuLine } from '@remixicon/react'

interface MenuToggleProps {
	toggle: () => void
	isOpen: boolean
	clasName?: string
}

export const MenuToggle: React.FC<Readonly<MenuToggleProps>> = ({
	toggle,
	isOpen,
	clasName,
}) => (
	<button id="menu-button" onClick={toggle} className={clasName}>
		{isOpen ? <RiCloseLargeFill className="text-white" /> : <RiMenuLine />}
	</button>
)
