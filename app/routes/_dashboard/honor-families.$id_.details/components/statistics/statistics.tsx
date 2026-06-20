import { ArrowRight } from 'lucide-react'

import { Separator } from '~/components/ui/separator'

export function Statistics() {
	return (
		<div className="flex items-center bg-card rounded-lg">
			<div className="basis-3/4 p-8">
				<div className="flex space-x-16 items-center">
					<StatUniItem
						label="Présents aux cultes"
						percentageValue="90"
						subValue="1000"
					/>

					<div className="space-y-8 relative">
						<div className="flex items-center">
							<ArrowRight className="text-muted-foreground absolute -left-8" />
							<StatUniItem
								label="Nouveaux"
								percentageValue="20"
								subValue="200"
							/>
						</div>
						<div className="flex items-center">
							<ArrowRight className="text-muted-foreground absolute -left-8" />
							<StatUniItem
								label="Anciens"
								percentageValue="80"
								subValue="800"
							/>
						</div>
					</div>

					<div className="space-y-8 relative">
						<div className="flex items-center">
							<ArrowRight className="text-muted-foreground absolute -left-8" />
							<StatDualItems
								data={[
									{
										percentageValue: '25',
										subValue: '50',
										label: 'Absents aux services',
									},
									{
										percentageValue: '75',
										subValue: '150',
										label: 'Présents aux services',
									},
								]}
							/>
						</div>
						<div className="flex items-center">
							<ArrowRight className="text-muted-foreground absolute -left-8" />
							<StatDualItems
								data={[
									{
										percentageValue: '70',
										subValue: '560',
										label: 'Absents aux services',
									},
									{
										percentageValue: '30',
										subValue: '240',
										label: 'Présents aux services',
									},
								]}
							/>
						</div>
					</div>
				</div>
			</div>

			<Separator className="bg-muted h-auto " orientation="vertical" />

			<div className="basis-1/4 flex justify-center">
				<StatUniItem
					label="Absents au culte"
					percentageValue="10"
					subValue="110"
				/>
			</div>
		</div>
	)
}

interface StatUniItemProps {
	percentageValue: string
	subValue: string
	label: string
}

const StatUniItem = ({
	label,
	subValue,
	percentageValue,
}: Readonly<StatUniItemProps>) => (
	<div className="bg-card p-3 rounded-lg border border-border min-w-[180px]">
		<div className="flex items-center space-x-2">
			<h2 className="text-2xl font-bold text-foreground">{percentageValue}%</h2>
			<div className="text-xs px-1.5 py-0.5 bg-muted rounded-full whitespace-nowrap">
				{subValue} Fidèles
			</div>
		</div>
		<p className="text-muted-foreground text-sm mt-2 font-medium">{label}</p>
	</div>
)

interface StatDualItemsProps {
	data: {
		label: string
		subValue: string
		percentageValue: string
	}[]
}

const StatDualItems = ({ data }: Readonly<StatDualItemsProps>) => (
	<div className="bg-card p-3 space-x-8 rounded-lg border flex justify-between border-border min-w-[360px]">
		{data.map((d, index) => (
			<div key={index}>
				<div className="flex items-center space-x-2">
					<h2 className="text-2xl font-bold text-foreground">
						{d.percentageValue}%
					</h2>
					<div className="text-xs px-1.5 py-0.5 bg-muted rounded-full whitespace-nowrap">
						{d.subValue} Fidèles
					</div>
				</div>
				<p className="text-muted-foreground text-sm mt-2 font-medium">
					{d.label}
				</p>
			</div>
		))}
	</div>
)
