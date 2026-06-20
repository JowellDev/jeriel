import { Link } from '@remix-run/react'
import {
	RiArrowRightSLine,
	RiArticleLine,
	RiCakeLine,
	RiUserForbidLine,
	type RemixiconComponentType,
} from '@remixicon/react'

const ACTIONS: { to: string; label: string; Icon: RemixiconComponentType }[] = [
	{ to: '/my-reports', label: 'Mes rapports', Icon: RiArticleLine },
	{ to: '/birthdays', label: 'Anniversaires', Icon: RiCakeLine },
	{
		to: '/archives-request',
		label: "Demande d'archivage",
		Icon: RiUserForbidLine,
	},
]

export function ManagerQuickActions() {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{ACTIONS.map(({ to, label, Icon }) => (
				<Link
					key={to}
					to={to}
					className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
				>
					<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Icon size={20} />
					</span>
					<span className="truncate text-sm font-medium text-foreground">
						{label}
					</span>
					<RiArrowRightSLine
						size={18}
						className="ml-auto shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
					/>
				</Link>
			))}
		</div>
	)
}
