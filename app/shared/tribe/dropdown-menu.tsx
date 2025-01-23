import { RiArrowDownSLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/utils/ui'

interface Props {
	onOpenManuallyForm: () => void
	onOpenUploadForm: () => void
	classname?: string
	variant?:
		| 'link'
		| 'default'
		| 'menu'
		| 'outline'
		| 'gold'
		| 'destructive'
		| 'secondary'
		| 'ghost'
		| 'primary-ghost'
		| 'destructive-ghost'
		| 'primary'
		| null
}

export function DropdownMenuComponent({
	onOpenManuallyForm,
	onOpenUploadForm,
	variant = 'primary',
	classname,
}: Readonly<Props>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					className={cn('hidden sm:flex items-center', classname)}
					variant={variant}
				>
					<span>Ajouter un fidèle</span>
					<RiArrowDownSLine size={20} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="border-none">
				<DropdownMenuGroup>
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={onOpenManuallyForm}
					>
						Ajouter manuellement
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer"
						onClick={onOpenUploadForm}
					>
						Importer un fichier
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
