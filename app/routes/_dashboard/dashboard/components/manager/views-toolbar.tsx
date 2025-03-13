import { type ViewOption, type View, ViewTabs } from '~/components/toolbar'

interface Props {
	views: View[]
	view: ViewOption
	setView?: (view: ViewOption) => void
}

export function ViewsToolbar({ view, views, setView }: Readonly<Props>) {
	return (
		<div className="rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
			<div className="w-full flex items-center justify-start space-x-2 sm:space-x-4 p-2">
				<ViewTabs options={views} activeView={view} setView={setView} />
			</div>
		</div>
	)
}
