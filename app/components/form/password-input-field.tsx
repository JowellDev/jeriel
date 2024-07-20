import { getInputProps, type FieldMetadata } from '@conform-to/react'
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons'
import { useCallback, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import FieldError from '~/components/form/field-error'
import { cn } from '~/utils/ui'

interface Props {
	label: string
	field: FieldMetadata<string>
	ErrorClassName?: string
	InputProps?: React.ComponentProps<typeof Input>
	LabelProps?: React.ComponentProps<typeof Label>
}

export default function PasswordInputField({
	label,
	field,
	LabelProps,
	InputProps,
	ErrorClassName,
}: Readonly<Props>) {
	const [showPassword, togglePassword] = useToggle()

	return (
		<div className="mb-2">
			<Label {...LabelProps} htmlFor={field.id}>
				{label}
			</Label>
			<div className="mt-1">
				<div className="w-full relative">
					<Input
						{...getInputProps(field, {
							type: showPassword ? 'text' : 'password',
						})}
						{...InputProps}
					/>
					<Button
						type="button"
						variant="ghost"
						onClick={togglePassword}
						className="absolute right-0 top-0 bottom-0"
						aria-label="Show or hide"
					>
						{showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
					</Button>
				</div>
				<FieldError className={cn('text-sm', ErrorClassName)} field={field} />
			</div>
		</div>
	)
}

function useToggle() {
	const [value, setValue] = useState(false)

	const toggleValue = useCallback(() => {
		setValue(prev => !prev)
	}, [])

	return [value, toggleValue] as const
}
