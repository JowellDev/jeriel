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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { type Member } from '~/models/member.model'
import TruncateTooltip from '~/components/truncate-tooltip'
import { useMediaQuery } from 'usehooks-ts'
import { MOBILE_WIDTH } from '~/shared/constants'

type Props = PropsWithChildren<{
	name: string
	membersCount: number
	managerName: string
	assistants: Member[]
	onOpenAssistantForm: () => void
}>

export function TribeHeader({
	children,
	name,
	membersCount,
	managerName,
	assistants,
	onOpenAssistantForm,
}: Readonly<Props>) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const navigate = useNavigate()

	return (
		<div className="pt-12 pb-4 pl-4 pr-4 sm:p-4 flex flex-row justify-between items-center mb-4 bg-white shadow">
			<div className="text-sm flex items-center sm:justify-center sm:items-center space-x-2 divide-x-2 divide-neutral-400">
				<Button
					size={isDesktop ? 'sm' : 'icon'}
					variant="ghost"
					className="space-x-1"
					onClick={() => navigate(-1)}
				>
					<RiArrowLeftLine size={16} />
					{isDesktop && <span>Retour</span>}
				</Button>
				<div className="pl-2">
					<TruncateTooltip
						maxLength={11}
						className="text-sm font-semibold"
						text={name}
					/>
				</div>
				<div className="pl-2 hidden sm:block">
					<MemberInfo
						isDesktop={isDesktop}
						membersCount={membersCount}
						managerName={managerName}
						assistants={assistants}
						onOpenAssistantForm={onOpenAssistantForm}
					/>
				</div>
			</div>
			<div className="flex gap-0 flex-row items-center">{children}</div>
		</div>
	)
}

export function MemberInfo({
	isDesktop,
	managerName,
	membersCount,
	assistants,
	onOpenAssistantForm,
}: Readonly<{
	isDesktop: boolean
	membersCount: number
	managerName: string
	assistants: Member[]
	onOpenAssistantForm: () => void
}>) {
	return (
		<div className="flex items-center space-x-6 text-sm">
			<div className="flex items-center space-x-2 relative">
				<RiGroupLine size={16} /> <span>{membersCount} Membres</span>
			</div>
			<div className="flex items-center space-x-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild className="cursor-pointer">
						<div className="flex items-center space-x-1">
							<RiUserStarLine size={16} />
							{isDesktop && (
								<>
									<span>Responsables</span>
									<RiArrowDownSLine size={16} />
								</>
							)}
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
	)
}
