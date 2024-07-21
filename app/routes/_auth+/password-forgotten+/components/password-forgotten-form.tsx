import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Link, useFetcher } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { schema } from '../schema'
import InputField from '~/components/form/input-field'
import { Button } from '~/components/ui/button'
import { type ActionType } from '../action.server'
import { Alert, AlertDescription } from '~/components/ui/alert'
import LoadingButton from '~/components/form/loading-button'

export function PasswordForgottenForm() {
	const fetcher = useFetcher<ActionType>()
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const [form, { email }] = useForm({
		constraint: getZodConstraint(schema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		id: 'password-forgotten-form',
		shouldRevalidate: 'onBlur',
	})

	return (
		<>
			{fetcher.data?.success ? (
				<div className="space-y-4">
					<Alert variant="info" className="rounded-xs">
						<AlertDescription className="text-sm text-center flex space-x-2 px-2">
							Un mail de vérification a été envoyé à votre adresse e-mail.
						</AlertDescription>
					</Alert>
					<Button
						type="submit"
						variant="default"
						className="w-full py-6 rounded"
					>
						<Link to="/login">se connecter</Link>
					</Button>
				</div>
			) : (
				<fetcher.Form
					className="space-y-5"
					{...getFormProps(form)}
					method="post"
					action="."
				>
					<InputField
						field={email}
						label="Email"
						InputProps={{ autoComplete: 'email', className: 'bg-white' }}
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
				</fetcher.Form>
			)}
		</>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
