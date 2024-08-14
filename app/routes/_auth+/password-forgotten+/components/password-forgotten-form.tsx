import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useFetcher } from '@remix-run/react'
import { toast } from 'sonner'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { schema } from '../schema'
import InputField from '~/components/form/input-field'
import { type ActionType } from '../action.server'
import LoadingButton from '~/components/form/loading-button'
import { useEffect } from 'react'

export function PasswordForgottenForm() {
	const fetcher = useFetcher<ActionType>()
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const [form, { phone }] = useForm({
		constraint: getZodConstraint(schema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		id: 'password-forgotten-form',
		shouldRevalidate: 'onBlur',
	})

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data && !fetcher.data.success) {
			const message = (fetcher.data as any).message
			if (message) toast.error(message)
		}
	}, [fetcher.state, fetcher.data])

	return (
		<fetcher.Form
			className="space-y-5"
			{...getFormProps(form)}
			method="post"
			action="."
		>
			<InputField
				field={phone}
				label="numéro de téléphone"
				InputProps={{ type: 'tel', className: 'bg-white' }}
			/>

			<LoadingButton
				size="lg"
				type="submit"
				className="w-full bg-[#226C67] py-6"
				loading={isSubmitting}
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Chargement...' : 'Récupérer mon compte'}
			</LoadingButton>
		</fetcher.Form>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
