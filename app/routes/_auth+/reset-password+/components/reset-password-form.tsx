import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form, useActionData, useFetcher } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import PasswordInputField from '~/components/form/password-input-field'
import { type ActionType } from '../action.server'
import LoadingButton from '~/components/loading-button'
import { schema } from '../schema'

export function ResetPasswordForm() {
	const lastSubmission = useActionData<ActionType>()
	const fetcher = useFetcher<ActionType>()

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const [form, { password, passwordConfirm }] = useForm({
		constraint: getZodConstraint(schema),
		lastResult: lastSubmission,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		id: 'login-form',
		shouldRevalidate: 'onBlur',
	})

	return (
		<Form
			className="space-y-5"
			{...getFormProps(form)}
			method="post"
			action="."
		>
			<PasswordInputField
				label="Nouveau mot de passe"
				field={password}
				InputProps={{ className: 'bg-white' }}
			/>
			<PasswordInputField
				label="Confirmer le mot de passe"
				field={passwordConfirm}
				InputProps={{ className: 'bg-white' }}
			/>

			<LoadingButton
				size="lg"
				type="submit"
				className="w-full bg-[#226C67] py-6"
				loading={isSubmitting}
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Chargement...' : 'Enregistrer'}
			</LoadingButton>
		</Form>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
