import { Button } from '~/components/ui/button'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form, useActionData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { CheckboxInput } from '~/components/form/checkbox-input'
import InputField from '~/components/form/input-field'
import PasswordInputField from '~/components/form/password-input-field'
import { useRedirectTo } from '../hooks/redirect'
import { schema, type ActionType } from '../action.servser'
import { PasswordForgottenLink } from './password-forgotten-link'

export function LoginForm() {
	const redirectToFromQuery = useRedirectTo()
	const lastSubmission = useActionData<ActionType>()

	const [form, { email, password, redirectTo, remember }] = useForm({
		constraint: getZodConstraint(schema),
		lastResult: lastSubmission,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		id: 'login-form',
		shouldRevalidate: 'onBlur',
		defaultValue: {
			redirectTo: redirectToFromQuery ?? '/',
		},
	})

	return (
		<Form
			className="space-y-5"
			{...getFormProps(form)}
			method="post"
			action="."
		>
			<InputField
				field={email}
				label="Email"
				InputProps={{ autoComplete: 'email' }}
			/>
			<div>
				<PasswordInputField label="Mot de passe" field={password} />
				<PasswordForgottenLink />
			</div>
			<input
				{...getInputProps(redirectTo, {
					type: 'text',
					hidden: true,
					ariaAttributes: false,
				})}
			/>
			<div className="flex items-center justify-between text-[#226C67] font-bold">
				<CheckboxInput
					field={remember}
					label="Se couvenir de moi"
					LabelProps={{ className: 'cursor-pointer' }}
				/>
			</div>
			<Button type="submit" className="w-full bg-[#226C67] py-6" size="lg">
				Se connecter
			</Button>
		</Form>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
