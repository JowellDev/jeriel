import { defineRdtConfig } from 'remix-development-tools'

const isProduction = process.env.NODE_ENV === 'production'

export default defineRdtConfig({
	suppressDeprecationWarning: true,
	client: {
		routeBoundaryGradient: 'sea',
	},
	server: {
		silent: isProduction,
		logs: {
			actions: !isProduction,
			loaders: !isProduction,
			cache: !isProduction,
			cookies: !isProduction,
			defer: !isProduction,
			siteClear: !isProduction,
		},
	},
})
