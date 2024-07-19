import { Button } from '~/components/ui/button'
import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { Form, useActionData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { CheckboxInput } from '~/components/form/checkbox-input'
import TextInput from '~/components/form/text-input'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useRedirectTo } from '../../join+/hooks/redirect'
import { schema, type Action } from '../action'
import { PasswordForgottenLink } from './password-forgotten-link'

export function LoginForm() {
	const redirectToFromQuery = useRedirectTo()
	const lastSubmission = useActionData<Action>()

	const [form, { email, password, redirectTo, remember }] = useForm({
		constraint: getFieldsetConstraint(schema),
		lastSubmission,
		onValidate({ formData }) {
			return parse(formData, { schema })
		},
		id: 'login-form',
		shouldRevalidate: 'onBlur',
		defaultValue: {
			redirectTo: redirectToFromQuery ?? '/',
		},
	})

	return (
		<Form method="post" className="space-y-6" {...form.props}>
			{!!form.error && (
				<div className="alert alert-error">
					<span>{form.error}</span>
				</div>
			)}
			<TextInput
				field={email}
				label="Email address"
				InputProps={{ autoComplete: 'email' }}
			/>

			<div className="mb-2">
				<Label htmlFor={password.id}>Password</Label>
				<div className="mt-1">
					<Input
						{...conform.input(password, {
							type: 'password',
							ariaAttributes: true,
						})}
						autoComplete="current-password"
					/>
					{password.error ? (
						<div className="label-text pt-1 text-red-500" id={password.errorId}>
							{password.error}
						</div>
					) : null}

					<PasswordForgottenLink />
				</div>
			</div>

			<input
				{...conform.input(redirectTo, {
					type: 'text',
					hidden: true,
					ariaAttributes: false,
				})}
			/>

			<div className="flex items-center justify-between text-[#226C67] font-bold">
				<CheckboxInput label="Remember me" field={remember} />
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
