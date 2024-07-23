import { RiSearch2Line } from '@remixicon/react'
import { Input } from './input'

export function InputSearch() {
	return (
		<div className="relative">
			<Input
				placeholder="Rechercher un utilisateur"
				className="w-full"
				variant={'search'}
			/>
			<RiSearch2Line className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
		</div>
	)
}
