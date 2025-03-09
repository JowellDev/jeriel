import { RiGroupLine } from '@remixicon/react'
import { type PropsWithChildren } from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { type View, type ViewOption, ViewTabs } from '~/components/toolbar'
import { MOBILE_WIDTH } from '~/shared/constants'

type Props = PropsWithChildren<{
	title: string
	userName: string
	entityType?: 'tribe' | 'department' | 'honorFamily'
	entityName?: string
	membersCount?: number
	views: View[]
	view: ViewOption
	setView?: (view: ViewOption) => void
}>

export function ManagerHeader({
	children,
	title,
	userName,
	entityType,
	entityName,
	membersCount,
	views,
	setView,
	view,
}: Readonly<Props>) {
	const type =
		entityType === 'tribe'
			? 'Tribu'
			: entityType === 'department'
				? 'Département'
				: "Famille d'honneur"

	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	return (
		<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:p-4 p-8 bg-white shadow">
			<div
				className={`flex items-center ${isDesktop ? 'space-x-14' : 'justify-between'}`}
			>
				<div
					className={`flex w-full items-center ${isDesktop ? 'space-x-3' : 'justify-between'}`}
				>
					<div className="flex flex-col -mt-1">
						<h1
							className={`${isDesktop ? 'text-lg' : 'text-md'} sm:text-xl font-bold mb-2 sm:mb-0 mt-[0.7rem] sm:mt-0 ml-6 sm:ml-0 text-[#226C67]`}
						>
							{title}
						</h1>

						{isDesktop && (
							<div className="text-xs -mt-1">
								Bonjour,<span className="font-semibold"> {userName}</span>
							</div>
						)}
					</div>

					<div className={`${isDesktop ? '-mt-1' : 'mt-2'} `}>
						<span className={`font-bold ${isDesktop ? 'text-md ' : 'text-xs'}`}>
							{type} : {entityName}
						</span>
						<div className="flex items-end text-xs space-x-1 relative -mt-1">
							<RiGroupLine size={18} /> <span>{membersCount} Membres</span>
						</div>
					</div>
				</div>
				{isDesktop && (
					<ViewTabs options={views} activeView={view} setView={setView} />
				)}
			</div>

			<div
				className={`${!title && 'w-full'} flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:space-x-2`}
			>
				{children}
			</div>
		</div>
	)
}
