import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import LoadingButton from '~/components/form/loading-button'
import TextInput from '~/components/form/text-input'
import useSubmitting from '~/hooks/submit'
import { schema, type Action } from '../action'
import { type Loader } from '../loader'

export function ResetPasswordForm() {
	const { email } = useLoaderData<Loader>()
	const lastSubmission = useActionData<Action>()

	const [form, { password, passwordConfirm }] = useForm({
		id: 'reset-password-form',
		lastSubmission,
		onValidate({ formData }) {
			return parse(formData, { schema })
		},
		shouldRevalidate: 'onBlur',
		constraint: getFieldsetConstraint(schema),
	})

	const isSubmitting = useSubmitting()

	return (
		<Form method="POST" className="space-y-6" {...form.props}>
			<p>{email}</p>

			<TextInput
				field={password}
				label="New password"
				InputProps={{ autoComplete: 'new-password' }}
			/>

			<TextInput
				field={passwordConfirm}
				label="Confirm new password"
				InputProps={{ autoComplete: 'new-password' }}
			/>

			<LoadingButton
				loading={isSubmitting}
				type="submit"
				className="w-full"
				disabled={isSubmitting}
			>
				reset password
			</LoadingButton>
		</Form>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
