import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type RemixiconComponentType, RiAddLine } from '@remixicon/react'

export interface SpeedDialAction {
	Icon: RemixiconComponentType
	label?: string
	action: string
}

interface SpeedDialItemProps extends SpeedDialAction {
	onClick: () => void
}

const SpeedDialItem: React.FC<Readonly<SpeedDialItemProps>> = ({
	Icon,
	onClick,
	label,
}) => (
	<motion.div
		initial={{ opacity: 0, y: 50 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: 50 }}
		transition={{ delay: 0.1 }}
	>
		<button
			onClick={onClick}
			className="p-3 bg-[#226C67] text-white rounded-full shadow-lg transition-colors flex gap-1 items-center"
		>
			<Icon size={24} />
			{label && <span>{label}</span>}
		</button>
	</motion.div>
)

const SpeedDialMenu: React.FC<Readonly<{
	items: SpeedDialAction[]
	onClick: (action: string) => void
}>> = ({ items, onClick }) => {
	const [isOpen, setIsOpen] = useState(false)

	const toggleMenu = () => setIsOpen(!isOpen)

	const handleItemClick = (action: string) => {
		onClick(action)
		setIsOpen(false)
	}

	return (
		<div className="fixed bottom-5 right-5 flex flex-col items-end sm:hidden">
			<AnimatePresence>
				{isOpen && (
					<motion.div className="flex flex-col-reverse items-center gap-3 mb-3">
						{items.map((item, index) => (
							<SpeedDialItem
								{...item}
								onClick={() => handleItemClick(item.action)}
								key={`@speeddial-${index}`}
							/>
						))}
					</motion.div>
				)}
			</AnimatePresence>
			<button
				onClick={toggleMenu}
				className={`p-6 bg-[#226C67] text-white rounded-full shadow-lg transition-colors ${isOpen && 'rotate-45'}`}
			>
				<RiAddLine size={24} />
			</button>
		</div>
	)
}

export default SpeedDialMenu
