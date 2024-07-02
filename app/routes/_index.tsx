import type { MetaFunction } from '@remix-run/node'
import { Form, Link } from '@remix-run/react'
import { useEffect } from 'react'
import { GeneralErrorBoundary } from '~/components/error-boundary'

import { useOptionalUser } from '~/utils/user'

export const meta: MetaFunction = () => [{ title: 'Nobu Stack' }]

export default function Index() {
	const user = useOptionalUser()

	return (
		<main className="relative min-h-screen sm:flex sm:items-center sm:justify-center">
			<div className="relative sm:pb-16 sm:pt-8">
				<div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
					<div className="relative space-y-8 px-4 pb-8 pt-16 sm:px-6 sm:pb-14 sm:pt-24 lg:px-8 lg:pb-20 lg:pt-32">
						<h1 className="text-center text-6xl font-extrabold tracking-tight sm:text-8xl lg:text-9xl">
							<span className="block uppercase text-primary drop-shadow-md">
								Nobu Stack
							</span>
						</h1>
						<p className="mx-auto mt-6 max-w-lg text-center text-xl text-neutral dark:text-slate-300 sm:max-w-3xl">
							Check the README.md file for instructions on how to start with the
							stack.
						</p>
						<div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
							{user ? (
								<div className="text-lg">
									<p>
										Welcome {user?.email}!{' '}
										<Form
											method="POST"
											action="/logout"
											className="inline-block"
										>
											<button className="link">Logout</button>{' '}
										</Form>
									</p>
								</div>
							) : (
								<div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
									<Link to="/join" className="btn-primary btn w-full">
										Sign up
									</Link>
									<Link to="/login" className="btn-secondary btn w-full">
										Log In
									</Link>
								</div>
							)}
						</div>
						<div className="mx-auto flex justify-center">
							<p className="text-center text-gray-500">
								Powered by{' '}
								<a
									href="remix.run"
									className="text-info"
									title="Remix Framework"
								>
									@Remix
								</a>
							</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
