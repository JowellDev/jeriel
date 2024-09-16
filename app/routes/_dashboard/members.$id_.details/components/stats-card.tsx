import { type RemixiconComponentType } from '@remixicon/react'
import * as React from 'react'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

type Props = React.PropsWithChildren<{
	title: React.ReactNode | string
	Icon?: RemixiconComponentType
	otherInfos?: string
}>

export default function StatsCard({
	title,
	Icon,
	otherInfos,
	children,
}: Readonly<Props>) {
	return (
		<Card>
			<CardHeader className="bg-[#226C67] rounded-t-md text-white text-lg">
				<div className="flex items-center space-x-2">
					{Icon && <Icon />}
					<div className="flex flex-col">
						<span>{title}</span>
						{otherInfos && <span className="text-sm">{otherInfos}</span>}
					</div>
				</div>
			</CardHeader>
			<CardContent className="min-h-[17rem]">{children}</CardContent>
		</Card>
	)
}
