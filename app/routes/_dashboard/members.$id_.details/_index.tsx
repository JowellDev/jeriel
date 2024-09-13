import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { loaderFn } from './loader.server'
import {
	RiAccountCircleFill,
	RiArrowLeftLine,
	RiFileExcel2Line,
	RiHome3Line,
	RiPencilLine,
	RiPhoneLine,
} from '@remixicon/react'
import { Button } from '~/components/ui/button'
import { Link } from '@remix-run/react'

export const loader = loaderFn

export default function MemberDetails() {
	return (
		<MainContent
			headerChildren={
				<Header>
					<div className="w-full flex justify-between items-center">
						<div className="flex items-center space-x-2 divide-x-2 divide-neutral-400">
							<Link to="/members">
								<Button variant="ghost" className="space-x-1">
									<RiArrowLeftLine size={16} />
									<span>Retour</span>
								</Button>
							</Link>
							<div className="pl-2 flex items-center space-x-5 text-sm">
								<div className="flex items-center space-x-1">
									<RiAccountCircleFill size={26} />
									<span className="font-semibold">Joël Ephraïm Digbeu</span>
								</div>
								<div className="flex items-center space-x-2 divide-x-2 divide-neutral-300 text-sm">
									<div className="flex items-center space-x-1">
										<RiPhoneLine size={14} />
										<span>0707827311</span>
									</div>
									<div className="flex items-center space-x-1 pl-2">
										<RiHome3Line size={14} />
										<span>Joël Ephraïm Digbeu</span>
									</div>
								</div>
							</div>
						</div>
						<div className="flex space-x-2">
							<Button variant="outline" size="sm" className="border-input">
								<RiPencilLine size={18} />
							</Button>
							<Button variant="outline" size="sm" className="border-input">
								Janvier 2024
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="space-x-1 border-input"
							>
								<span>Exporter</span>
								<RiFileExcel2Line />
							</Button>
						</div>
					</div>
				</Header>
			}
		>
			<div>
				<h1>Hello world</h1>
			</div>
		</MainContent>
	)
}
