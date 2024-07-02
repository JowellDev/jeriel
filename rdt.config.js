import { defineRdtConfig } from 'remix-development-tools'

const customConfig = defineRdtConfig({
	client: {
		position: 'top-right',
		defaultOpen: true,
		expansionLevel: 1,
		height: 500,
		minHeight: 300,
		maxHeight: 1000,
		hideUntilHover: true,
		panelLocation: 'bottom',
		requireUrlFlag: false,
		routeBoundaryGradient: 'gotham',
	},
})

export default customConfig
