import {
	RiArrowDownSLine,
	RiArrowLeftLine,
	RiGroupLine,
	RiUserStarLine,
} from '@remixicon/react'
import { type PropsWithChildren } from 'react'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Link } from '@remix-run/react'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Member, type ViewOption } from '../types'
import { ViewButtons } from './views-buttons'

type Props = PropsWithChildren<{
	returnLink: string
	name: string
	membersCount: number
	managerName: string
	assistants: Member[]
	view: ViewOption
	setView: (view: ViewOption) => void
	onOpenAssistantForm: () => void
}>

export function HonorFamilyHeader({
	children,
	returnLink,
	name,
	membersCount,
	managerName,
	assistants,
	onOpenAssistantForm,
	view,
	setView,
}: Readonly<Props>) {
	return (
		<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:p-4 p-4 bg-white shadow">
			<div className="text-sm flex items-center sm:justify-center sm:items-center space-x-2">
				<Link to={returnLink}>
					<Button variant={'ghost'} className="pl-2">
						<RiArrowLeftLine /> <span>Retour</span>
					</Button>
				</Link>
				<Separator
					className="w-[3px] bg-gray-300 h-[35px]"
					decorative
					orientation="vertical"
				/>
				<h5 className="text-[16px] font-bold mb-2 sm:mb-0 sm:text-sm mt-[2rem] sm:mt-0 ml-6 sm:ml-0 text-[#226C67]">
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
						<div className="flex items-center">
							<span>Responsables</span>
							<RiArrowDownSLine size={20} />
						</div>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="mr-3">
						<DropdownMenuItem className="cursor-pointer flex flex-col items-start">
							<span className="font-bold">Responsable principal</span>
							<span> {managerName} </span>
						</DropdownMenuItem>
						<DropdownMenuItem className="cursor-default">
							<div className="flex flex-col items-start">
								<span className="font-bold">Assistants</span>
								{assistants.length > 0 ? (
									assistants.map((assistant, index) => {
										return (
											<>
												<span key={assistant.id}>{assistant.name}</span>
												{!(index === assistants.length - 1) && <Separator />}
											</>
										)
									})
								) : (
									<span>Aucun assistant</span>
								)}
							</div>
						</DropdownMenuItem>
						<Separator />
						<DropdownMenuItem onSelect={event => event.preventDefault()}>
							<Button
								size="sm"
								variant="outline"
								onClick={event => {
									event.stopPropagation()
									onOpenAssistantForm()
								}}
								className="w-full"
							>
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
