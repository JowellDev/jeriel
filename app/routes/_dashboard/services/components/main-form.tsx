import React, { useCallback, useEffect, useState } from 'react'
import { useFetcher } from '@remix-run/react'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import InputRadio from '~/components/form/radio-field'
import { FORM_INTENT, serviceEntities } from '../constants'
import { type MemberFilterOptionsApiData } from '~/routes/api/get-members-select-options/_index'
import type { SelectOption } from '~/shared/types'
import { createServiceSchema } from '../schema'
import { SelectField } from '~/components/form/select-field'
import InputField from '~/components/form/input-field'
import { toast } from 'sonner'

interface Options {
	departments: SelectOption[]
	tribes: SelectOption[]
}

interface MainFormProps extends React.ComponentProps<'form'> {
	isSubmitting: boolean
	fetcher: ReturnType<typeof useFetcher<any>>
	onClose?: () => void
}

export default function MainForm({
	className,
	isSubmitting,
	fetcher,
	onClose,
}: MainFormProps) {
	const { load, ...apiFetcher } = useFetcher<MemberFilterOptionsApiData>()

	const [selectOptions, setSelectOptions] = useState<Options>({
		departments: [],
		tribes: [],
	})

	const formAction = '.'
	const schema = createServiceSchema

	const [form, fields] = useForm({
		id: 'entity-service-form',
		constraint: getZodConstraint(schema),
		lastResult: fetcher.data?.lastResult,
		shouldRevalidate: 'onBlur',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		defaultValue: {
			entity: serviceEntities.DEPARTMENT,
		},
	})

	const handleOnEntityChange = useCallback(
		(value: string) => {
			form.update({ name: 'entity', value })
		},
		[form],
	)

	useEffect(() => {
		load('/api/get-members-select-options')
	}, [load])

	useEffect(() => {
		if (apiFetcher.state === 'idle' && apiFetcher.data) {
			const { departments, tribes } = apiFetcher.data
			setSelectOptions({ departments, tribes })
		}
	}, [apiFetcher.data, apiFetcher.state])

	useEffect(() => {
		if (fetcher.data?.success) {
			onClose?.()
			toast.success('Service ajouté avec succès', { duration: 5000 })
		}
	}, [fetcher.data, onClose])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4 pt-4', className)}
		>
			<div className="mb-4">
				<InputField field={fields.entity} InputProps={{ hidden: true }} />
				<InputRadio
					inline
					label="Entité"
					field={fields.entity}
					onValueChange={handleOnEntityChange}
					options={[
						{ label: 'Département', value: serviceEntities.DEPARTMENT },
						{ label: 'Tribu', value: serviceEntities.TRIBE },
					]}
				/>
			</div>
			{fields.entity.value === serviceEntities.DEPARTMENT ? (
				<SelectField
					field={fields.departmentId}
					label="Département"
					placeholder="Sélectionner un département"
					items={selectOptions.departments}
				/>
			) : (
				<SelectField
					field={fields.tribeId}
					label="Tribu"
					placeholder="Sélectionner une tribu"
					items={selectOptions.tribes}
				/>
			)}

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					name="intent"
					value={FORM_INTENT.CREATE}
					variant="primary"
					disabled={isSubmitting}
					className="w-full sm:w-auto"
				>
					Créer
				</Button>
			</div>
		</fetcher.Form>
	)
}
