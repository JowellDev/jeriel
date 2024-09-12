import { getDomain } from './url'

describe('getDomain', () => {
	it.concurrent('should get the domain from x-forwarded-host header', () => {
		const domain = 'mydomain.com'
		const headers = new Map()
		headers.set('X-Forwarded-Host', domain)

		const request = { headers } as unknown as Request
		expect(getDomain(request)).toBe(`https://${domain}`)
	})

	it.concurrent('should get domain from host header', () => {
		const domain = 'mydomain.com'
		const headers = new Map()
		headers.set('host', domain)

		const request = { headers } as unknown as Request
		expect(getDomain(request)).toBe(`https://${domain}`)
	})

	it.concurrent('should return http domain if localhost', () => {
		const domain = 'localhost'
		const headers = new Map()
		headers.set('host', domain)

		const request = { headers } as unknown as Request
		expect(getDomain(request)).toBe(`http://${domain}`)
	})
	it.concurrent(
		'should throw an exception if domain can not be determined',
		() => {
			const headers = new Map()

			const request = { headers } as unknown as Request
			expect(() => getDomain(request)).toThrowError(
				/Could not determine domain URL./i,
			)
		},
	)
})
