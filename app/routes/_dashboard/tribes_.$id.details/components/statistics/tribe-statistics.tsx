import { Separator } from '~/components/ui/separator'

export function TribeStatistics() {
	return (
		<div className="flex items-center bg-[#FFF] rounded-sm">
			<div className="basis-3/4 p-8">
				<div className="flex space-x-28 items-center">
					<div className="bg-white p-4 rounded-lg border border-gray-200">
						<div className="flex space-x-2">
							<h2 className="text-4xl font-bold text-gray-900">90%</h2>
							<div className="text-sm mt-auto bg-gray-200 rounded-full">
								709 Fidèles
							</div>
						</div>

						<p className="text-gray-600 text-[14px] mt-2 font-semibold">
							Présents aux cultes
						</p>
					</div>

					<div className="flex space-x-12">
						<div className="space-y-6">
							<div className="bg-white p-4 rounded-lg border border-gray-200">
								<div className="flex space-x-2">
									<h2 className="text-4xl font-bold text-gray-900">20%</h2>
									<div className="text-sm px-1 mt-auto bg-gray-200 rounded-full">
										709 Fidèles
									</div>
								</div>
								<p className="text-gray-600 text-[14px] mt-2 font-semibold">
									Nouveaux
								</p>
							</div>

							<div className="bg-white p-4 rounded-lg border border-gray-200">
								<div className="flex space-x-2">
									<h2 className="text-4xl font-bold text-gray-900">80%</h2>
									<div className="text-sm px-1 mt-auto bg-gray-200 rounded-full">
										709 Fidèles
									</div>
								</div>
								<p className="text-gray-600 text-[14px] mt-2 font-semibold">
									Anciens
								</p>
							</div>
						</div>
					</div>
					<div className="flex flex-col space-x-12 ">
						<div className="space-y-6">
							<div className="bg-white p-4 space-x-8 rounded-lg border flex justify-between border-gray-200">
								<div>
									<div className="flex space-x-2">
										<h2 className="text-4xl font-bold text-gray-900">11%</h2>
										<div className="text-sm px-1 mt-auto bg-gray-200 rounded-full">
											709 Fidèles
										</div>
									</div>
									<p className="text-gray-600 text-[14px] mt-2 font-semibold">
										Absents aux services
									</p>
								</div>
								<div>
									<div className="flex space-x-2">
										<h2 className="text-4xl font-bold text-gray-900">89%</h2>
										<div className="text-sm px-1 mt-auto bg-gray-200 rounded-full">
											709 Fidèles
										</div>
									</div>
									<p className="text-gray-600 text-[14px] mt-2 font-semibold">
										Présents aux services
									</p>
								</div>
							</div>

							<div className="bg-white p-4 space-x-8 rounded-lg border flex justify-between border-gray-200">
								<div>
									<div className="flex space-x-2">
										<h2 className="text-4xl font-bold text-gray-900">11%</h2>
										<div className="text-sm px-1 mt-auto bg-gray-200 rounded-full">
											709 Fidèles
										</div>
									</div>
									<p className="text-gray-600 text-[14px] mt-2 font-semibold">
										Absents aux services
									</p>
								</div>
								<div>
									<div className="flex space-x-2">
										<h2 className="text-4xl font-bold text-gray-900">89%</h2>
										<div className="text-sm px-1 mt-auto bg-gray-200 rounded-full">
											709 Fidèles
										</div>
									</div>
									<p className="text-gray-600 text-[14px] mt-2 font-semibold">
										Présents aux services
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Separator className="bg-gray-200 h-[330px]" orientation="vertical" />

			<div className="basis-1/4 p-16">
				<div className="bg-white p-4 space-x-8 rounded-lg border border-gray-200">
					<div className="flex space-x-2">
						<h2 className="text-4xl font-bold text-gray-900">10%</h2>
						<div className="text-sm mt-auto bg-gray-200 rounded-full">
							709 Fidèles
						</div>
					</div>
					<p className="text-gray-600 text-[14px] mt-2 font-semibold ml-0">
						Absents au culte
					</p>
				</div>
			</div>
		</div>
	)
}

interface StatItemProps {
	percentageValue: string
	subValue: string
	label: string
}

const StatItem = ({
	percentageValue,
	label,
	subValue,
}: Readonly<StatItemProps>) => (
	<div className="flex items-center border border-gray-200 min-w-[15rem] rounded-lg p-4 shadow-sm">
		<div>
			<div className="text-4xl font-bold">{percentageValue}</div>
			<div className="text-xs text-gray-500 mt-1">{label}</div>
		</div>
		<div>
			<div className="text-[12px] text-gray-600 text-[14px] mt-2 font-semibold px-1 rounded-full bg-gray-200">
				{subValue}
			</div>
		</div>
	</div>
)
