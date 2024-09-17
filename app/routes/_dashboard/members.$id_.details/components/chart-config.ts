import { type ChartConfig } from '~/components/ui/chart'

export const sundayChartConfig = {
	sunday: {
		label: 'Présences aux cultes',
		color: '#B5EAE7',
	},
} satisfies ChartConfig

export const honoryFamilyChartConfig = {
	...sundayChartConfig,
	service: {
		label: 'Présences aux réunions',
		color: '#B4E3C4',
	},
} satisfies ChartConfig

export const serviceChartConfig = {
	...sundayChartConfig,
	service: {
		label: 'Présences aux services',
		color: '#B4E3C4',
	},
} satisfies ChartConfig
