import type { FieldMetadata } from '@conform-to/react'
import userEvent from '@testing-library/user-event'
import PasswordInput from '~/components/form/password-input-field'
import { render, screen } from '~/utils/testing'

describe('PasswordInput', () => {
	const field = {
		name: 'password',
		id: 'password',
	} as FieldMetadata<string>

	const label = 'Password'

	it('should render', async () => {
		render(<PasswordInput field={field} label={label} />)

		await screen.findByLabelText(/password/i)

		expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/password/i)).toHaveAttribute(
			'type',
			'password',
		)
	})

	it('should render the label', async () => {
		render(<PasswordInput field={field} label={label} />)

		await screen.findByText(/password/i)

		expect(screen.getByText(/password/i)).toBeInTheDocument()
	})

	it('should render the error', async () => {
		const error = 'Password is required'

		render(<PasswordInput field={field} label={label} />)

		expect(screen.queryByText(error)).not.toBeInTheDocument()

		const fieldWithError = {
			...field,
			error,
		} as FieldMetadata<string>

		render(<PasswordInput field={fieldWithError} label={label} />)

		await screen.findByText(error)

		expect(screen.getByText(error)).toBeInTheDocument()
	})

	it('should render eye button', async () => {
		render(<PasswordInput field={field} label={label} />)

		expect(await screen.findByRole('button')).toBeInTheDocument()
	})

	it('should toggle password visibility', async () => {
		render(<PasswordInput field={field} label={label} />)

		await userEvent.click(screen.getByLabelText(/show or hide/i))

		expect(await screen.findByLabelText(/password/i)).toHaveAttribute(
			'type',
			'text',
		)
	})

	it('should pass InputProps to the input', async () => {
		const inputProps = {
			autoComplete: 'new-password',
			placeholder: 'Enter your password',
		}
		render(
			<PasswordInput field={field} label={label} InputProps={inputProps} />,
		)

		const input = screen.getByLabelText(/password/i)

		expect(input).toHaveAttribute('placeholder', inputProps.placeholder)
		expect(input).toHaveAttribute('autocomplete', inputProps.autoComplete)
	})

	it('should pass LabelProps to the label', async () => {
		const labelProps = {
			className: 'text-red-500',
		}
		render(
			<PasswordInput field={field} label={label} LabelProps={labelProps} />,
		)

		expect(screen.getByText(label)).toHaveClass(labelProps.className)
	})
})
