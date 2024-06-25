import { safeRedirect } from './redirect'

describe('safeRedirect', () => {
	it('should return "/" if "to" is undefined', () => {
		const to = undefined
		const expected = '/'
		expect(safeRedirect(to)).toBe(expected)
	})

	it('should return "/" if "to" does not start with "/"', () => {
		const to = 'fakeurl'
		const expected = '/'
		expect(safeRedirect(to)).toBe(expected)
	})

	it('should return "/" if "to" starts with "//"', () => {
		const to = '//fakeurl'
		const expected = '/'
		expect(safeRedirect(to)).toBe(expected)
	})

	it('should return "/login" if "to" is invalid', () => {
		const to = '//fakeurl'
		const defaultRedirect = '/login'
		const expected = '/login'
		expect(safeRedirect(to, defaultRedirect)).toBe(expected)
	})
})
