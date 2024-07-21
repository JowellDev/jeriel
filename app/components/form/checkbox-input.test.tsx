import type { FieldMetadata } from '@conform-to/react'
import { render, screen } from '~/utils/testing'
import { CheckboxInput } from './checkbox-input'

describe('CheckboxInput', () => {
	const label = 'CGU'
	const field = { name: 'cgu', id: 'cgu' } as FieldMetadata<boolean>

	it('should render', () => {
		render(<CheckboxInput label={label} field={field} />)

		expect(screen.getByText(label)).toBeInTheDocument()
		expect(screen.getByLabelText(label)).toBeInTheDocument()
	})

	it('should pass LabelProps to Label', () => {
		const labelProps = { className: 'label' }
		render(
			<CheckboxInput label={label} field={field} LabelProps={labelProps} />,
		)

		expect(screen.getByText(label)).toHaveClass(labelProps.className)
	})

	it('should check the checkbox when field.defaultValue is "on"', () => {
		render(
			<CheckboxInput label={label} field={{ ...field, initialValue: 'on' }} />,
		)

		expect(screen.getByLabelText(label)).toBeChecked()
	})
})
