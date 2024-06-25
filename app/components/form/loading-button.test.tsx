import { render, screen } from '~/utils/testing'
import LoadingButton from './loading-button'

describe('LoadingButton', () => {
	it('should render', async () => {
		render(<LoadingButton loading={false}>Submit</LoadingButton>)

		await screen.findByText('Submit')

		expect(screen.getByText('Submit')).toBeInTheDocument()
	})

	it('should render the loading icon', async () => {
		render(<LoadingButton loading>Submit</LoadingButton>)

		expect(screen.getByRole('img')).toBeInTheDocument()
	})
})
