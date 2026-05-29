import { createCanvas } from '@napi-rs/canvas'

interface ChartData {
	legend: string
	labels: string[]
	values: number[]
}

const PIE_COLORS = [
	'#4E79A7',
	'#F28E2B',
	'#E15759',
	'#76B7B2',
	'#59A14F',
	'#EDC948',
	'#B07AA1',
	'#FF9DA7',
	'#9C755F',
	'#BAB0AC',
]

export function generatePieChartBase64({
	legend,
	labels,
	values,
}: ChartData): string {
	const total = values.reduce((sum, v) => sum + v, 0)
	const chartHeight = Math.max(400, labels.length * 28 + 100)
	const canvas = createCanvas(700, chartHeight)
	const ctx = canvas.getContext('2d')

	ctx.fillStyle = '#ffffff'
	ctx.fillRect(0, 0, 700, chartHeight)

	ctx.fillStyle = '#1e293b'
	ctx.font = 'bold 16px sans-serif'
	ctx.textAlign = 'center'
	ctx.fillText(legend, 350, 28)

	if (total > 0) {
		const cx = 210
		const cy = chartHeight / 2 + 15
		const radius = Math.min(150, (chartHeight - 80) / 2)
		let startAngle = -Math.PI / 2

		values.forEach((value, i) => {
			const sliceAngle = (value / total) * 2 * Math.PI
			ctx.beginPath()
			ctx.moveTo(cx, cy)
			ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle)
			ctx.closePath()
			ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length]
			ctx.fill()
			ctx.strokeStyle = '#ffffff'
			ctx.lineWidth = 2
			ctx.stroke()
			startAngle += sliceAngle
		})

		const legendX = cx + radius + 30
		let legendY = 60

		labels.forEach((label, i) => {
			const pct = ((values[i] / total) * 100).toFixed(1)
			const display = label.length > 22 ? `${label.substring(0, 22)}…` : label

			ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length]
			ctx.fillRect(legendX, legendY - 12, 14, 14)

			ctx.fillStyle = '#374151'
			ctx.font = '12px sans-serif'
			ctx.textAlign = 'left'
			ctx.fillText(`${display} — ${values[i]} (${pct}%)`, legendX + 20, legendY)

			legendY += 28
		})
	}

	return canvas.toBuffer('image/png').toString('base64')
}
