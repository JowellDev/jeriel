import { Outlet } from '@remix-run/react'
import { Separator } from '~/components/ui/separator'
import { loaderFn } from './loader.server'

export const loader = loaderFn

export default function AuthLayout() {
	return (
		<div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-50 md:bg-[url('/images/auth-bg.png')] md:bg-no-repeat md:bg-center md:bg-cover">
			<div className="absolute top-0 left-0 right-0 h-1 bg-[#226C67] md:hidden" />
			<div className="w-full md:max-w-lg px-6 py-12 sm:px-10 space-y-6 bg-white md:bg-white/90 md:rounded-2xl md:shadow-2xl md:px-12 md:py-12">
				<div className="space-y-4">
					<img
						src="/images/green-logo-vh.png"
						alt="logo-vh"
						className="mx-auto md:mx-0 max-h-16 w-auto"
					/>
					<Separator className="bg-[#226C6780]" />
				</div>
				<Outlet />
			</div>
		</div>
	)
}
