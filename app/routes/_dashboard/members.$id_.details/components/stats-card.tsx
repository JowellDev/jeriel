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
			<CardHeader className="bg-[#226C67] rounded-t-md text-white text-sm sm:text-lg p-3 sm:p-4">
				<div className="flex items-center space-x-2">
					{Icon && <Icon />}
					<div className="flex flex-col space-y-1">
						<span>{title}</span>
						{otherInfos && (
							<span className="text-xs sm:text-sm">{otherInfos}</span>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="min-h-[200px] sm:min-h-[17rem]">
				{children}
			</CardContent>
		</Card>
	)
}
