import { useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	Form,
	useActionData,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import LoadingButton from '~/components/form/loading-button'
import TextInput from '~/components/form/text-input'
import useSubmitting from '~/hooks/submit'
import { clientSchema, type Action } from '../action'
import type { Loader } from '../loader'

export function VerifyForm() {
	const [searchParams] = useSearchParams()

	const actionData = useActionData<Action>()
	const loaderData = useLoaderData<Loader>()

	const lastSubmission = loaderData?.submission ?? actionData?.submission
	const isSubmitting = useSubmitting()

	const [form, { otp, email }] = useForm({
		constraint: getFieldsetConstraint(clientSchema),
		lastSubmission,
		onValidate({ formData }) {
			return parse(formData, { schema: clientSchema })
		},
		id: 'verify-form',
		shouldRevalidate: 'onBlur',
		defaultValue: {
			otp: lastSubmission?.payload.otp ?? searchParams.get('otp') ?? '',
			email: lastSubmission?.payload.email ?? searchParams.get('email') ?? '',
		},
	})

	return (
		<Form method="POST" className="space-y-6" {...form.props}>
			<TextInput
				label="Email Address"
				field={email}
				InputProps={{ readOnly: true }}
			/>

			<TextInput
				label="OTP"
				field={otp}
				InputProps={{ autoFocus: true, maxLength: 6 }}
			/>

			<LoadingButton className="w-full" loading={isSubmitting}>
				validate your email
			</LoadingButton>
		</Form>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
