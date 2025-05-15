import { Outlet } from '@remix-run/react'
import { Separator } from '~/components/ui/separator'
import { loaderFn } from './loader.server'

export const loader = loaderFn

export default function AuthLayout() {
	return (
		<div className="flex jusitfy-center items-center h-screen bg-[url('/images/auth-bg.png')] bg-no-repeat bg-center bg-cover">
			<div className="max-w-lg mx-4 md:mx-auto p-12 space-y-4 bg-white/[.9] rounded-2xl">
				<div>
					<img src="/images/green-logo-vh.png" alt="logo-vh" />
					<Separator className="bg-[#226C6780]" />
				</div>
				<Outlet />
			</div>
		</div>
	)
}
