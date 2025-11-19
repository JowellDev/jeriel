import { getFormProps, type SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form, Link, useActionData, useNavigation } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { schema } from '../schema'
import InputField from '~/components/form/input-field'
import { type ActionType } from '../action.server'
import { ButtonLoading } from '~/components/button-loading'
import { useState } from 'react'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { RiArrowLeftLine } from '@remixicon/react'

export function PasswordForgottenForm() {
	const lastResult = useActionData<ActionType>()
	const navigation = useNavigation()

	const [email, setEmail] = useState('')

	const isSubmitting = navigation.state === 'submitting'
	const isOk = lastResult?.status === 'success'

	const [form, fields] = useForm({
		id: 'password-forgotten-form',
		lastResult: lastResult as SubmissionResult<string[]>,
		constraint: getZodConstraint(schema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		shouldRevalidate: 'onInput',
		shouldValidate: 'onSubmit',
	})

	return (
		<Form
			{...getFormProps(form)}
			className="space-y-6"
			method="post"
			action="."
		>
			{isOk ? (
				<Alert variant="success">
					<AlertDescription>
						Un mail de réinitialisation a été envoyé à l'adresse{' '}
						<span className="font-semibold">{email}</span>
					</AlertDescription>
				</Alert>
			) : (
				<InputField
					field={fields.email}
					label="Email"
					inputProps={{
						type: 'email',
						className: 'bg-white',
						onChange: e => setEmail(e.target.value),
					}}
				/>
			)}

			<div className="flex items-center justify-end">
				<Link
					to="/login"
					className="text-[#226C67] font-semibold text-sm flex items-center space-x-2 group"
				>
					<RiArrowLeftLine
						size={20}
						className="group-hover:-translate-x-1 duration-200"
					/>
					<span>Retour sur la page de connexion</span>
				</Link>
			</div>

			{!isOk && (
				<ButtonLoading
					size="lg"
					type="submit"
					className="w-full bg-[#226C67] py-6"
					loading={isSubmitting}
				>
					Récupérer mon compte
				</ButtonLoading>
			)}
		</Form>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
