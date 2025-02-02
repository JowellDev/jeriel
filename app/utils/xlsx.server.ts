import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import * as fs from 'fs/promises'
import * as path from 'path'

interface GenerateFileNameData {
	customerName: string
	feature: string
}

interface CreateFileData {
	feature: string
	fileName?: string
	customerName: string
	safeRows: Record<string, string>[]
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
			widths[i] = Math.max(widths[i] + 0.2 || 10, value.length + 2)
		})
		return widths
	}, [] as number[])

	worksheet['!cols'] = colWidths.map(width => ({ wch: width }))
}

export async function createFile({
	feature,
	safeRows,
	customerName,
	fileName,
}: CreateFileData): Promise<string> {
	const worksheet = XLSX.utils.json_to_sheet(safeRows)
	const workbook = XLSX.utils.book_new()

	XLSX.utils.book_append_sheet(workbook, worksheet, feature)

	setColumnWidths(worksheet, safeRows)

	const fileBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

	const directory = path.resolve('public', 'download')

	const generatedFileName = generateFileName({
		customerName,
		feature: fileName ?? feature,
	})
	const filePath = path.join(directory, generatedFileName)

	await fs.writeFile(filePath, fileBuffer)

	return `download/${generatedFileName}`
}
