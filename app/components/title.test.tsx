import { render, screen } from '~/utils/testing'
import { Title } from './title'

describe('Title', () => {
	it('should render', () => {
		render(<Title>Test</Title>)

		expect(screen.getByText(/test/i)).toBeInTheDocument()
	})

	it('should render with a h4 tag', () => {
		render(<Title tag="h4">Test</Title>)

		expect(screen.getByText(/test/i)).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: /test/i })).toBeInTheDocument()
	})

	it('should render with an fancy underline', () => {
		render(<Title underlined>Test</Title>)

		expect(screen.getByText(/test/i)).toBeInTheDocument()
		expect(screen.getByText(/test/i)).toHaveClass('before:border')
	})
})
