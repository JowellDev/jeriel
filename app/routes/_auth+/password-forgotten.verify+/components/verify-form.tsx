import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { type ActionType } from '../action.server'
import { parseWithZod, getZodConstraint } from '@conform-to/zod'
import { verificationSchema } from '../schema'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import useSubmitting from '~/hooks/submit'
import InputField from '~/components/form/input-field'
import LoadingButton from '~/components/loading-button'
import { type LoaderType } from '../loader.server'

export function VerifyForm() {
	const loaderData = useLoaderData<LoaderType>()
	const actionData = useActionData<ActionType>()
	const isSubmitting = useSubmitting()

	const lastResult = actionData

	const [form, { otp, email }] = useForm({
		id: 'verify-form',
		lastResult: lastResult as SubmissionResult<string[]>,
		constraint: getZodConstraint(verificationSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: verificationSchema })
		},
		shouldRevalidate: 'onBlur',
		defaultValue: {
			email: loaderData.data.email,
		},
	})

	return (
		<Form method="POST" className="space-y-5" {...getFormProps(form)}>
			<InputField
				field={email}
				label="Adresse email"
				inputProps={{
					type: 'hidden',
					hidden: true,
					className: 'bg-white',
				}}
			/>

			<InputField
				field={otp}
				label="Code OTP"
				inputProps={{
					className: 'bg-white',
					maxLength: 6,
				}}
			/>

			<LoadingButton
				size="lg"
				type="submit"
				className="w-full bg-[#226C67] py-6"
				loading={isSubmitting}
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Chargement...' : 'Vérifier'}
			</LoadingButton>
		</Form>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
