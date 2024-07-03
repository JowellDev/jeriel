import { conform, type FieldConfig } from '@conform-to/react'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'

interface Props {
	label: string
	field: FieldConfig<boolean>
	LabelProps?: React.ComponentPropsWithoutRef<typeof Label>
}

export function CheckboxInput({ label, field, LabelProps }: Readonly<Props>) {
	const { type: _, ...checkboxProps } = conform.input(field, {
		type: 'checkbox',
	})

	return (
		<div className="flex items-center space-x-2">
			<Checkbox {...checkboxProps} />
			<Label htmlFor={field.id} {...LabelProps}>
				{label}
			</Label>
		</div>
	)
}
