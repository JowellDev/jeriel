import ExcelJS from 'exceljs'
import { startOfDay } from 'date-fns'
import {
	applySheetStyle,
	buildMembersFileName,
	saveExcelBuffer,
} from '~/utils/excel.server'
import type { ExportDataset } from '../constants'
import type { AnalyticsInputs } from '../server/gather.server'
import { buildAtRiskMembers } from '../server/metrics/attendance.server'
import { buildIncompleteList } from '../server/metrics/data-quality.server'
import { percentage } from '../server/metrics/utils'

type ExcelRow = Record<string, string | number>

const DATASET_LABEL: Record<ExportDataset, string> = {
	'at-risk': 'Membres à risque',
	attendance: 'Assiduité',
	incomplete: 'Fiches incomplètes',
}

function buildSheet(workbook: ExcelJS.Workbook, name: string, rows: ExcelRow[]) {
	const sheet = workbook.addWorksheet(name)
	if (rows.length > 0) {
		sheet.columns = Object.keys(rows[0]).map(key => ({
			header: key,
			key,
			width: 26,
		}))
		rows.forEach(row => sheet.addRow(row))
	}
	applySheetStyle(sheet)
}

function atRiskRows(inputs: AnalyticsInputs): ExcelRow[] {
	return buildAtRiskMembers({
		members: inputs.members,
		currentAttendances: inputs.currentAttendances,
		previousAttendances: inputs.previousAttendances,
		periodSundays: inputs.periodSundays,
		lookbackSundays: inputs.lookbackSundays,
		rankingEntities: inputs.rankingEntities,
	}).map(m => ({
		'Nom & prénoms': m.name,
		Téléphone: m.phone ?? 'N/D',
		'Dimanches manqués': m.missedCount,
		'Dernière présence': m.lastSeen ?? 'Jamais',
	}))
}

function incompleteRows(inputs: AnalyticsInputs): ExcelRow[] {
	return buildIncompleteList(inputs.members).map(m => ({
		'Nom & prénoms': m.name,
		'Champs manquants': m.missing.join(', '),
	}))
}

function attendanceRows(inputs: AnalyticsInputs): ExcelRow[] {
	const sundayTimes = inputs.periodSundays.map(s => startOfDay(s).getTime())
	const present = presentCountByMember(inputs)

	return inputs.members.map(m => {
		const count = present.get(m.id) ?? 0
		return {
			'Nom & prénoms': m.name,
			Téléphone: m.phone ?? 'N/D',
			Présences: count,
			'Dimanches': sundayTimes.length,
			'Taux (%)': percentage(count, sundayTimes.length),
		}
	})
}

function presentCountByMember(inputs: AnalyticsInputs): Map<string, number> {
	const sundayTimes = new Set(
		inputs.periodSundays.map(s => startOfDay(s).getTime()),
	)
	const map = new Map<string, number>()
	for (const a of inputs.currentAttendances) {
		if (!a.inChurch) continue
		if (!sundayTimes.has(startOfDay(new Date(a.date)).getTime())) continue
		map.set(a.memberId, (map.get(a.memberId) ?? 0) + 1)
	}
	return map
}

const ROW_BUILDERS: Record<ExportDataset, (i: AnalyticsInputs) => ExcelRow[]> = {
	'at-risk': atRiskRows,
	attendance: attendanceRows,
	incomplete: incompleteRows,
}

/** Génère et sauvegarde le fichier Excel d'un jeu de données analytique. */
export async function createAnalyticsExcelFile(
	dataset: ExportDataset,
	inputs: AnalyticsInputs,
): Promise<string> {
	const label = DATASET_LABEL[dataset]
	const workbook = new ExcelJS.Workbook()
	buildSheet(workbook, label, ROW_BUILDERS[dataset](inputs))

	const buffer = await workbook.xlsx.writeBuffer()
	return saveExcelBuffer(buffer, buildMembersFileName(`analytique-${label}`))
}
