import { Link } from '@remix-run/react'
import { RiPhoneLine } from '@remixicon/react'
import { Badge } from '~/components/ui/badge'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'
import type { AtRiskMember } from '../types'
import { EmptyState } from './section-card'

interface AtRiskTableProps {
	members: AtRiskMember[]
}

/** Liste actionnable des membres en risque d'absentéisme. */
export function AtRiskTable({ members }: Readonly<AtRiskTableProps>) {
	if (members.length === 0) {
		return <EmptyState message="Aucun membre à risque sur cette période 🎉" />
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Membre</TableHead>
					<TableHead className="text-center">Manqués</TableHead>
					<TableHead className="hidden sm:table-cell">Vu pour la dernière fois</TableHead>
					<TableHead className="text-right">Contact</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{members.map(member => (
					<TableRow key={member.id}>
						<TableCell>
							<Link
								to={`/members/${member.id}/details`}
								className="font-medium text-foreground hover:text-primary hover:underline"
							>
								{member.name}
							</Link>
						</TableCell>
						<TableCell className="text-center">
							<Badge variant="destructive">{member.missedCount}</Badge>
						</TableCell>
						<TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
							{member.lastSeen ?? 'Jamais'}
						</TableCell>
						<TableCell className="text-right">
							{member.phone ? (
								<a
									href={`tel:${member.phone}`}
									className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
								>
									<RiPhoneLine size={14} />
									{member.phone}
								</a>
							) : (
								<span className="text-xs text-muted-foreground">N/D</span>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
