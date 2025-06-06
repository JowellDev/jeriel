import { getInputProps, type FieldMetadata } from '@conform-to/react'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { useCallback, useState } from 'react'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import FieldError from '~/components/form/field-error'
import { cn } from '~/utils/ui'

interface Props {
	label: string
	field: FieldMetadata<string>
	errorClassName?: string
	inputProps?: React.ComponentProps<typeof Input>
	labelProps?: React.ComponentProps<typeof Label>
}

export default function PasswordInputField({
	label,
	field,
	labelProps,
	inputProps,
	errorClassName,
}: Readonly<Props>) {
	const [showPassword, togglePassword] = useToggle()
	const iconSize = 18

	return (
		<div className="w-full">
			<Label
				{...labelProps}
				className={cn(
					{ 'label-required': field.required },
					labelProps?.className,
				)}
				htmlFor={field.id}
			>
				{label}
			</Label>
			<div className="mt-1">
				<div className="w-full relative">
					<Input
						{...getInputProps(field, {
							type: showPassword ? 'text' : 'password',
						})}
						{...inputProps}
					/>
					<button
						type="button"
						onClick={togglePassword}
						className="absolute inset-y-0 right-4 flex items-center"
						aria-label="Show or hide"
					>
						{showPassword ? (
							<RiEyeLine size={iconSize} />
						) : (
							<RiEyeOffLine size={iconSize} />
						)}
					</button>
				</div>
				<FieldError className={cn('text-xs', errorClassName)} field={field} />
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
