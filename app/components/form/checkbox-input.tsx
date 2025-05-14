import { getInputProps, type FieldMetadata } from '@conform-to/react'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'

interface Props {
	label: string
	field: FieldMetadata<boolean>
	labelProps?: React.ComponentPropsWithoutRef<typeof Label>
}

export function CheckboxInput({ label, field, labelProps }: Readonly<Props>) {
	const { type: _, ...checkboxProps } = getInputProps(field, {
		type: 'checkbox',
	})

	return (
		<div className="flex items-center space-x-2">
			<Checkbox {...checkboxProps} />
			<Label htmlFor={field.id} {...labelProps}>
				{label}
			</Label>
		</div>
	)
}
