import MonthPicker from '~/components/form/month-picker'
import { SelectInput } from '~/components/form/select-input'
import type { ExportDataset } from '../constants'
import type { AnalyticsFilter } from '../schema'
import type { AnalyticsScope } from '../types'
import { ExportButton } from './export-button'

interface ToolbarProps {
	scope: AnalyticsScope
	filter: AnalyticsFilter
	exports: { dataset: ExportDataset; label: string }[]
	onEntityChange: (value: string) => void
	onPeriodChange: (range: { from: Date; to: Date }) => void
}

/** Barre de filtres : sélecteur d'entité, période et exports contextuels. */
export function AnalyticsToolbar({
	scope,
	filter,
	exports,
	onEntityChange,
	onPeriodChange,
}: Readonly<ToolbarProps>) {
	const entityOptions = scope.entities.map(entity => ({
		label: entity.name,
		value: `${entity.type}:${entity.id}`,
	}))
	const selectedValue = scope.selectedEntity
		? `${scope.selectedEntity.type}:${scope.selectedEntity.id}`
		: undefined

	return (
		<div className="flex flex-wrap items-center gap-2">
			{entityOptions.length > 1 && (
				<SelectInput
					placeholder="Entité"
					items={entityOptions}
					value={selectedValue}
					onChange={onEntityChange}
				/>
			)}
			<MonthPicker
				defaultMonth={new Date(filter.from)}
				onChange={onPeriodChange}
			/>
			{exports.map(item => (
				<ExportButton
					key={item.dataset}
					dataset={item.dataset}
					label={item.label}
					filter={filter}
				/>
			))}
		</div>
	)
}
