import {
	Form,
	useActionData,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { type ActionType } from '../action.server'
import { type LoaderType } from '../loader.server'
import { parseWithZod, getZodConstraint } from '@conform-to/zod'
import { verificationSchema } from '../schema'
import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import useSubmitting from '~/hooks/submit'
import InputField from '~/components/form/input-field'
import LoadingButton from '~/components/form/loading-button'

export function VerifyForm() {
	const [searchParams] = useSearchParams()
	const actionData = useActionData<ActionType>()
	const loaderData = useLoaderData<LoaderType>()
	const isSubmitting = useSubmitting()

	const lastResult = actionData ?? loaderData

	const [form, { otp, phone }] = useForm({
		id: 'verify-form',
		lastResult: lastResult as SubmissionResult<string[]>,
		constraint: getZodConstraint(verificationSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: verificationSchema })
		},
		shouldRevalidate: 'onBlur',
		defaultValue: {
			otp: searchParams.get('otp') ?? '',
			phone: searchParams.get('phone') ?? '',
		},
	})

	return (
		<Form method="POST" className="space-y-5" {...getFormProps(form)}>
			<InputField
				field={phone}
				label="Numéro de téléphone"
				InputProps={{
					type: 'hidden',
					hidden: true,
					className: 'bg-white',
				}}
			/>

			<InputField
				field={otp}
				label="Code OTP"
				InputProps={{
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
