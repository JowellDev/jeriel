import { renderHook } from '@testing-library/react'
import { useRedirectTo } from './redirect'

const mockGet = vi.hoisted(() => vi.fn())

vi.mock('@remix-run/react', async () => {
	const actual = await vi.importActual('@remix-run/react')
	return {
		...actual,
		useSearchParams: vi.fn().mockReturnValue([
			{
				get: mockGet,
			},
			undefined,
		]),
	}
})

describe.concurrent('useRedirectTo', () => {
	beforeEach(() => {
		mockGet.mockReset()
	})

	it('should return the value of redirectTo from searchParams', () => {
		const expected = '/'

		mockGet.mockReturnValue(expected)

		const { result } = renderHook(() => useRedirectTo())

		expect(result.current).toBe(expected)
	})

	it('should return null if redirectTo is not in searchParams', () => {
		const expected = null

		mockGet.mockReturnValue(null)

		const { result } = renderHook(() => useRedirectTo())

		expect(result.current).toBe(expected)
	})
})
