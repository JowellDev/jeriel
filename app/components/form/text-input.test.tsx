import type { FieldConfig } from '@conform-to/react'
import { render, screen } from '~/utils/testing'
import TextInput from './text-input'

describe('TextInput', () => {
	const field = { name: 'email' } satisfies FieldConfig<string>
	const label = 'Email address'

	it('should render', async () => {
		render(<TextInput field={field} label={label} />)

		await screen.findByRole('textbox')

		expect(screen.getByRole('textbox')).toBeInTheDocument()
	})

	it('should render the label', async () => {
		render(<TextInput field={field} label={label} />)

		await screen.findByText(label)

		expect(screen.getByText(label)).toBeInTheDocument()
	})

	it('should display the error message', async () => {
		const errorMessage = 'This is an error'
		const fieldWithError = {
			...field,
			error: errorMessage,
		}
		render(<TextInput field={fieldWithError} label={label} />)

		await screen.findByText(errorMessage)

		expect(screen.getByText(errorMessage)).toBeInTheDocument()
	})

	it('should pass InputProps to the input', async () => {
		const inputProps = {
			autoComplete: 'email',
			placeholder: 'Enter your email',
		}
		render(<TextInput field={field} label={label} InputProps={inputProps} />)

		const input = screen.getByRole('textbox')

		expect(input).toHaveAttribute('placeholder', inputProps.placeholder)
		expect(input).toHaveAttribute('autocomplete', inputProps.autoComplete)
	})

	it('should pass LabelProps to the label', async () => {
		const labelProps = {
			className: 'text-red-500',
		}
		render(<TextInput field={field} label={label} LabelProps={labelProps} />)

		expect(screen.getByText(label)).toHaveClass(labelProps.className)
	})
})
