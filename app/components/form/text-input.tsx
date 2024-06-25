import { Input } from '#/input'
import { Label } from '#/label'
import type { FieldConfig } from '@conform-to/react'
import { conform } from '@conform-to/react'
import FieldError from '~/components/form/field-error'

interface Props {
	label: string
	field: FieldConfig<string>
	LabelProps?: React.ComponentProps<typeof Label>
	InputProps?: React.ComponentProps<typeof Input>
}

export default function TextInput({
	label,
	field,
	LabelProps,
	InputProps,
}: Readonly<Props>) {
	return (
		<div className="mb-2">
			<Label {...LabelProps} htmlFor={field.id}>
				{label}
			</Label>
			<div className="mt-1">
				<Input
					{...conform.input(field, {
						type: 'email',
					})}
					{...InputProps}
				/>
				<FieldError field={field} />
			</div>
		</div>
	)
}
