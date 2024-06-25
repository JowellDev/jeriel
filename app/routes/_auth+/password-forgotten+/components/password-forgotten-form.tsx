import { Alert, AlertDescription, AlertTitle } from '#/alert'
import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { CheckCircledIcon } from '@radix-ui/react-icons'
import { useFetcher } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import LoadingButton from '~/components/form/loading-button'
import TextInput from '~/components/form/text-input'
import { schema, type Action } from '../action'

export function PasswordForgottenForm() {
	const passwordForgotten = useFetcher<Action>()

	const lastSubmission = passwordForgotten.data
		? passwordForgotten.data.submission
		: undefined

	const [form, { email }] = useForm({
		constraint: getFieldsetConstraint(schema),
		lastSubmission,
		onValidate({ formData }) {
			return parse(formData, { schema })
		},
		shouldRevalidate: 'onBlur',
		id: 'password-forgotten-form',
	})

	const isSubmitting = ['submitting'].includes(passwordForgotten.state)

	return (
		<>
			{passwordForgotten.state === 'idle' && !passwordForgotten.data?.ok ? (
				<passwordForgotten.Form
					method="POST"
					className="space-y-6"
					action="."
					{...form.props}
				>
					<TextInput
						label="Email address"
						field={email}
						InputProps={{ autoFocus: true, autoComplete: 'email' }}
					/>

					<LoadingButton
						type="submit"
						disabled={isSubmitting}
						loading={isSubmitting}
						className="w-full"
					>
						{isSubmitting ? 'Please wait...' : 'Send verification mail'}
					</LoadingButton>
				</passwordForgotten.Form>
			) : (
				<div className="alert alert-success">
					<Alert>
						<CheckCircledIcon
							className="h-4 w-4"
							role="img"
							aria-label="email sent check"
						/>
						<AlertTitle>Mail sent!</AlertTitle>
						<AlertDescription>
							We have sent you an e-mail with instructions to reset your
							password.
						</AlertDescription>
					</Alert>
				</div>
			)}
		</>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
