import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useFetcher } from '@remix-run/react'
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import InputRadio from '~/components/form/radio-field'
import { FORM_INTENT, serviceEntities } from '../constants'
import { type MemberFilterOptionsApiData } from '~/routes/api/get-members-select-options/_index'
import type { SelectOption } from '~/shared/types'
import { schema } from '../schema'
import { SelectField } from '~/components/form/select-field'
import InputField from '~/components/form/input-field'
import { DateRangePicker } from '~/components/form/date-picker'
import FieldError from '~/components/form/field-error'
import type { ServiceData } from '../types'

interface Options {
	departments: SelectOption[]
	tribes: SelectOption[]
}

interface MainFormProps extends React.ComponentProps<'form'> {
	isSubmitting: boolean
	fetcher: ReturnType<typeof useFetcher<any>>
	service?: ServiceData
	onClose?: () => void
}

export default function MainForm({
	className,
	fetcher,
	service,
	isSubmitting,
	onClose,
}: MainFormProps) {
	const { load, ...apiFetcher } = useFetcher<MemberFilterOptionsApiData>()

	const isEdit = !!service
	const formAction = isEdit ? `${service?.id}` : '.'

	const [isDateReseted, setIsDateReseted] = useState(!isEdit)
	const [selectOptions, setSelectOptions] = useState<Options>({
		departments: [],
		tribes: [],
	})

	const defaultPeriod = useMemo(
		() => ({
			from: service ? new Date(service.from).toISOString() : undefined,
			to: service ? new Date(service.to).toISOString() : undefined,
		}),
		[service],
	)

	const [form, fields] = useForm({
		id: 'entity-service-form',
		constraint: getZodConstraint(schema),
		lastResult: fetcher.data?.lastResult,
		shouldRevalidate: 'onBlur',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema })
		},
		defaultValue: {
			to: defaultPeriod?.to,
			from: defaultPeriod?.from,
			entity: service?.entity.type ?? serviceEntities.DEPARTMENT,
			departmentId:
				service?.entity.type === 'department' ? service?.entity.id : undefined,
			tribeId:
				service?.entity.type === 'tribe' ? service?.entity.id : undefined,
		},
	})

	const handleOnEntityChange = useCallback(
		(value: string) => {
			form.update({ name: 'entity', value })
		},
		[form],
	)

	const handleDateRangeChange = useCallback(
		({ from, to }: { from?: string; to?: string }) => {
			if (from && to) setIsDateReseted(false)
			form.update({ name: 'from', value: from })
			form.update({ name: 'to', value: to })
		},
		[form],
	)

	const handleResetDateRange = useCallback(() => {
		setIsDateReseted(true)
		handleDateRangeChange({ from: undefined, to: undefined })
	}, [handleDateRangeChange])

	useEffect(() => {
		load('/api/get-members-select-options')
	}, [load])

	useEffect(() => {
		if (apiFetcher.state === 'idle' && apiFetcher.data) {
			const { departments, tribes } = apiFetcher.data
			setSelectOptions({ departments, tribes })
		}
	}, [apiFetcher.data, apiFetcher.state])

	return (
		<fetcher.Form
			{...getFormProps(form)}
			method="post"
			action={formAction}
			className={cn('grid items-start gap-4 pt-4', className)}
		>
			<div className="mb-2">
				<InputField field={fields.entity} InputProps={{ hidden: true }} />
				<InputRadio
					inline
					isDisabled={isEdit}
					label="Entité"
					field={fields.entity}
					onValueChange={handleOnEntityChange}
					options={[
						{ label: 'Département', value: serviceEntities.DEPARTMENT },
						{ label: 'Tribu', value: serviceEntities.TRIBE },
					]}
				/>
			</div>
			<div className="grid sm:grid-cols-2 gap-4">
				{fields.entity.value === serviceEntities.DEPARTMENT ? (
					<SelectField
						field={fields.departmentId}
						label="Département"
						placeholder="Sélectionner un département"
						items={selectOptions.departments}
						disabled={isEdit}
					/>
				) : (
					<SelectField
						field={fields.tribeId}
						label="Tribu"
						placeholder="Sélectionner une tribu"
						items={selectOptions.tribes}
						disabled={isEdit}
					/>
				)}
				<div className="w-full space-y-1">
					<span className="text-sm">Période de service</span>
					<DateRangePicker
						defaultLabel="Sélectionner une période"
						onResetDate={handleResetDateRange}
						defaultValue={defaultPeriod}
						onValueChange={dateRange =>
							handleDateRangeChange({
								from: dateRange?.from?.toUTCString(),
								to: dateRange?.to?.toUTCString(),
							})
						}
						className="w-full py-6"
					/>
					<FieldError className="text-xs" field={fields.from} />

					{!isDateReseted && (
						<>
							<InputField field={fields.from} InputProps={{ hidden: true }} />
							<InputField field={fields.to} InputProps={{ hidden: true }} />
						</>
					)}
				</div>
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}

				<Button
					type="submit"
					name="intent"
					value={isEdit ? FORM_INTENT.UPDATE : FORM_INTENT.CREATE}
					variant="primary"
					disabled={isSubmitting}
					className="w-full sm:w-auto"
				>
					{isEdit ? 'Enrégistrer' : 'Ajouter'}
				</Button>
			</div>
		</fetcher.Form>
	)
}
