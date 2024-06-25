import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { Form, useActionData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import LoadingButton from '~/components/form/loading-button'
import PasswordInput from '~/components/form/password-input'
import TextInput from '~/components/form/text-input'
import useSubmitting from '~/hooks/submit'
import { clientSchema, type Action } from '../action'
import { useRedirectTo } from '../hooks/redirect'

export function JoinForm() {
	const redirectTo = useRedirectTo()
	const lastSubmission = useActionData<Action>()
	const isSubmitting = useSubmitting()

	const [form, { email, password }] = useForm({
		constraint: getFieldsetConstraint(clientSchema),
		lastSubmission,
		onValidate({ formData }) {
			return parse(formData, { schema: clientSchema })
		},
		id: 'join-form',
		shouldRevalidate: 'onBlur',
	})

	return (
		<Form method="post" className="space-y-6" {...form.props}>
			<TextInput
				label="Email address"
				field={email}
				InputProps={{ autoFocus: true, autoComplete: 'email' }}
			/>

			<PasswordInput
				label="Password"
				field={password}
				InputProps={{ autoComplete: 'new-password' }}
			/>

			<input
				data-testid="redirect-to"
				type="hidden"
				name="redirectTo"
				value={redirectTo ?? undefined}
			/>

			<LoadingButton
				type="submit"
				variant="default"
				className="w-full"
				disabled={isSubmitting}
				loading={isSubmitting}
			>
				{isSubmitting ? 'Please wait...' : 'Create Account'}
			</LoadingButton>
		</Form>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
