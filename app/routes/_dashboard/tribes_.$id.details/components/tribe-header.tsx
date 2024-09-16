import {
	RiArrowDownSLine,
	RiArrowLeftLine,
	RiGroupLine,
	RiUserStarLine,
} from '@remixicon/react'
import { type PropsWithChildren } from 'react'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { useNavigate } from '@remix-run/react'
import { ViewButtons } from './views-buttons'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { type ViewOption } from '../types'

type Props = PropsWithChildren<{
	returnLink: string
	name: string
	membersCount: number
	managerName: string
	view: ViewOption
	setView: (view: ViewOption) => void
}>

export function TribeHeader({
	children,
	returnLink,
	name,
	membersCount,
	managerName,
	view,
	setView,
}: Readonly<Props>) {
	const navigate = useNavigate()
	return (
		<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:p-4 p-4 bg-white shadow">
			<div className="text-sm flex items-center space-x-2">
				<Button variant={'ghost'} onClick={() => navigate(returnLink)}>
					<RiArrowLeftLine /> Retour
				</Button>
				<Separator
					className="w-[3px] bg-gray-300 h-[35px]"
					decorative
					orientation="vertical"
				/>
				<h5 className="text-[16px] sm:text-md font-bold mb-2 sm:mb-0 mt-[3.5rem] sm:mt-0 ml-6 sm:ml-0 text-[#226C67]">
					{name}
				</h5>
				<ViewButtons activeView={view} setView={setView} />
				<Separator
					className="w-[2px] bg-gray-300 h-[35px]"
					decorative
					orientation="vertical"
				/>
				<RiGroupLine />
				<div>{membersCount} Membres</div>
				<RiUserStarLine />
				<DropdownMenu>
					<DropdownMenuTrigger asChild className="cursor-pointer">
						<div className="hidden sm:flex items-center">
							<span>Responsables</span>
							<RiArrowDownSLine size={20} />
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="mr-3 ">
						<DropdownMenuItem className="cursor-pointer flex flex-col items-start">
							<span className="font-bold">Responsable principal</span>
							<span> {managerName} </span>
						</DropdownMenuItem>
						<DropdownMenuItem className="cursor-pointer">
							<span className="font-bold">Assistants</span>
						</DropdownMenuItem>
						<Separator />
						<DropdownMenuItem className="cursor-pointer flex justify-center">
							<Button size="sm" variant="outline">
								Ajouter un assistant
							</Button>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:space-x-2">
				{children}
			</div>
		</div>
	)
}
