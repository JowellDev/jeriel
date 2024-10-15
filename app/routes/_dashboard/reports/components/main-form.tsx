import { type useFetcher } from '@remix-run/react'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import { archiveUserSchema } from '../schema'

import { useEffect } from 'react'

interface MainFormProps extends React.ComponentProps<'form'> {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<any>>
	onClose?: () => void
}

export default function MainForm({
	className,
	isLoading,
	fetcher,
	onClose,
}: Readonly<MainFormProps>) {
	const lastSubmission = fetcher.data

	const formAction = '.'
	const schema = archiveUserSchema

	const [form] = useForm({
		id: 'archive-request-form',
		constraint: getZodConstraint(schema),
		lastResult: lastSubmission,
		onValidate: ({ formData }) => parseWithZod(formData, { schema }),
		shouldRevalidate: 'onBlur',
	})

	useEffect(() => {
		//
	}, [])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4 pt-4', className)}
			encType="multipart/form-data"
		>
			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					name="intent"
					value="archivate"
					variant="primary"
					disabled={isLoading}
					className="w-full sm:w-auto"
				>
					Enregistrer
				</Button>
			</div>
		</fetcher.Form>
	)
}
