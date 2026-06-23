import { useState } from 'react'
import { useFetcher } from '@remix-run/react'
import { RiFileExcel2Line, RiLoader4Line } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import { useDownloadFile } from '~/shared/hooks/download-file'
import type { ExportDataset } from '../constants'
import type { AnalyticsFilter } from '../schema'

interface ExportButtonProps {
	dataset: ExportDataset
	label: string
	filter: AnalyticsFilter
}

/** Bouton d'export Excel d'un jeu de données, filtré par entité et période. */
export function ExportButton({
	dataset,
	label,
	filter,
}: Readonly<ExportButtonProps>) {
	const fetcher = useFetcher()
	const [isExporting, setIsExporting] = useState(false)
	useDownloadFile(fetcher, { isExporting, setIsExporting })

	return (
		<fetcher.Form method="post" onSubmit={() => setIsExporting(true)}>
			<input type="hidden" name="intent" value="export" />
			<input type="hidden" name="dataset" value={dataset} />
			<input type="hidden" name="from" value={filter.from} />
			<input type="hidden" name="to" value={filter.to} />
			{filter.entityType && (
				<input type="hidden" name="entityType" value={filter.entityType} />
			)}
			{filter.entityId && (
				<input type="hidden" name="entityId" value={filter.entityId} />
			)}
			<Button
				type="submit"
				variant="outline"
				size="sm"
				disabled={isExporting}
				className="flex items-center gap-1 border-input"
			>
				{isExporting ? (
					<RiLoader4Line size={16} className="animate-spin" />
				) : (
					<RiFileExcel2Line size={16} />
				)}
				<span className="hidden sm:inline">{label}</span>
			</Button>
		</fetcher.Form>
	)
}
