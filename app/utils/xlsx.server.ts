import { format } from 'date-fns'
import type * as XLSX from 'xlsx'

interface GenerateFileNameData {
	customerName: string
	feature: string
}

export function generateFileName({
	customerName,
	feature,
}: GenerateFileNameData) {
	const sanitizedCustomerName = customerName
		.toLowerCase()
		.replace(/[^a-z0-9]/gi, '_')

	return `${feature}-generes-le-${encodeURIComponent(
		encodeURIComponent(format(new Date(), 'dd_MM_yyyy_hh_mm_ss')),
	)}-par-${sanitizedCustomerName}.xlsx`
}

export function setColumnWidths(
	worksheet: XLSX.WorkSheet,
	rows: Record<string, string>[],
) {
	const colWidths = rows.reduce((widths, row) => {
		Object.keys(row).forEach((key, i) => {
			const value = String(row[key])
			widths[i] = Math.max(widths[i] || 10, value.length + 2)
		})
		return widths
	}, [] as number[])

	worksheet['!cols'] = colWidths.map(width => ({ wch: width }))
}
