import { Alert, AlertDescription, AlertTitle } from '#/alert'
import { ReportDialog } from '@highlight-run/remix/report-dialog'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { isRouteErrorResponse, useRouteError } from '@remix-run/react'

const isProduction = process.env.NODE_ENV === 'production'
let HIGHLIGHT_PROJECT_ID = ''

try {
	HIGHLIGHT_PROJECT_ID = process.env.HIGHLIGHT_PROJECT_ID ?? ''
} catch (error) {}

type Props = {
	routeErrorRenderer?: (error: {
		status: number
		statusText: string
		data: any
		error?: Error
	}) => JSX.Element
	errorRenderer?: (error: Error) => JSX.Element
	unknownErrorRenderer?: (error: unknown) => JSX.Element
}

export function GeneralErrorBoundary({
	routeErrorRenderer = error => (
		<div className="mx-auto flex max-h-full w-full max-w-md flex-col justify-center pt-16">
			<Alert variant="destructive">
				<ExclamationTriangleIcon className="h-4 2-4" />
				<AlertTitle>{error.status}</AlertTitle>
				<AlertDescription>{error.data}</AlertDescription>
			</Alert>
		</div>
	),
	errorRenderer = error => (
		<div className="mx-auto flex w-fit flex-col items-start justify-center break-words pt-16">
			<script src="https://unpkg.com/highlight.run"></script>
			<script
				dangerouslySetInnerHTML={{
					__html: `
							H.init('${HIGHLIGHT_PROJECT_ID}');
						`,
				}}
			/>

			{!isProduction && (
				<h1 className="py-2 text-2xl text-red-500 font-semibold">Error</h1>
			)}
			<Alert variant="destructive">
				<ExclamationTriangleIcon className="h-4 2-4" />
				<AlertTitle>{error.message}</AlertTitle>
				<AlertDescription>
					{isProduction ? (
						'An error occurred while rendering. Please try again later'
					) : (
						<pre className="text-xs">{error.stack}</pre>
					)}
				</AlertDescription>
			</Alert>

			<ReportDialog />
		</div>
	),
	unknownErrorRenderer = error => (
		<div>
			<div className="alert alert-error">
				<span>Unknown Error</span>
			</div>
		</div>
	),
}: Props) {
	const error = useRouteError()

	return isRouteErrorResponse(error)
		? routeErrorRenderer(error)
		: error instanceof Error
			? errorRenderer(error)
			: unknownErrorRenderer(error)
}
