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
import { ViewButtons } from './views-buttons'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { type ViewOption } from '../types'
import { type Member } from '~/models/member.model'

type Props = PropsWithChildren<{
	name: string
	membersCount: number
	managerName: string
	assistants: Member[]
	view: ViewOption
	setView: (view: ViewOption) => void
	onOpenAssistantForm: () => void
}>

export function TribeHeader({
	children,
	name,
	membersCount,
	managerName,
	assistants,
	view,
	setView,
	onOpenAssistantForm,
}: Readonly<Props>) {
	return (
		<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:p-4 p-4 bg-white shadow">
			<div className="text-sm flex items-center sm:justify-center sm:items-center space-x-2 divide-x-2 divide-neutral-400">
				<Link to="/tribes">
					<Button variant="ghost" className="space-x-1">
						<RiArrowLeftLine size={16} />
						<span>Retour</span>
					</Button>
				</Link>
				<div className="pl-2">
					<div className="flex items-center space-x-1 text-sm">
						<span className="text-sm font-semibold">{name}</span>
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
								<DropdownMenuItem
									className="cursor-default"
									onSelect={event => event.preventDefault()}
								>
									<div className="flex flex-col items-start">
										<span className="font-bold">Responsable principal</span>
										<span>{managerName}</span>
									</div>
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-default"
									onSelect={event => event.preventDefault()}
								>
									<div className="flex flex-col items-start">
										<span className="font-bold">Assistants</span>
										{assistants.length > 0 ? (
											assistants.map(assistant => (
												<span key={assistant.id}>{assistant.name}</span>
											))
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
				</div>
			</div>
			<div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:space-x-2">
				{children}
			</div>
		</div>
	)
}
