import * as React from 'react'
import { Command, CommandGroup, CommandItem, CommandList } from '../ui/command'
import { Command as CommandPrimitive, useCommandState } from 'cmdk'
import { useEffect, forwardRef } from 'react'
import { cn } from '~/utils/ui'
import { Badge } from '../ui/badge'
import { RiCloseLine } from '@remixicon/react'
import { Label } from '../ui/label'
import { type FieldMetadata } from '@conform-to/react'
import InputField from './input-field'

export interface Option {
	value: string
	label: string
	disable?: boolean
	/** fixed option that can't be removed. */
	fixed?: boolean
	/** Group the options by providing key. */
	[key: string]: string | boolean | undefined
}
interface GroupOption {
	[key: string]: Option[]
}

interface MultipleSelectorProps {
	value?: Option[]
	defaultOptions?: Option[]
	defaultValue?: Option[]
	/** manually controlled options */
	options?: Option[]
	placeholder?: string
	/** Loading component. */
	loadingIndicator?: React.ReactNode
	/** Empty component. */
	emptyIndicator?: React.ReactNode
	/** Debounce time for async search. Only work with `onSearch`. */
	delay?: number
	/**
	 * Only work with `onSearch` prop. Trigger search when `onFocus`.
	 * For example, when user click on the input, it will trigger the search to get initial options.
	 **/
	triggerSearchOnFocus?: boolean
	/** async search */
	onSearch?: (value: string) => Promise<Option[]>
	onChange?: (options: Option[]) => void
	/** Limit the maximum number of selected options. */
	maxSelected?: number
	/** When the number of selected options exceeds the limit, the onMaxSelected will be called. */
	onMaxSelected?: (maxLimit: number) => void
	/** Hide the placeholder when there are options selected. */
	hidePlaceholderWhenSelected?: boolean
	disabled?: boolean
	/** Group the options base on provided key. */
	groupBy?: string
	className?: string
	badgeClassName?: string
	/**
	 * First item selected is a default behavior by cmdk. That is why the default is true.
	 * This is a workaround solution by add a dummy item.
	 *
	 * @reference: https://github.com/pacocoursey/cmdk/issues/171
	 */
	selectFirstItem?: boolean
	/** Allow user to create option when there is no option matched. */
	creatable?: boolean
	/** Props of `Command` */
	commandProps?: React.ComponentPropsWithoutRef<typeof Command>
	/** Props of `CommandInput` */
	inputProps?: Omit<
		React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
		'value' | 'placeholder' | 'disabled'
	>
	testId?: string
	listPosition?: 'top' | 'bottom'
	selectAreaClassName?: string
}

export interface MultipleSelectorRef {
	selectedValue: Option[]
	input: HTMLInputElement
	setInputValue: (value: string) => void
}

export function useDebounce<T>(value: T, delay?: number): T {
	const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

		return () => {
			clearTimeout(timer)
		}
	}, [value, delay])

	return debouncedValue
}

function transToGroupOption(options: Option[], groupBy?: string) {
	if (options.length === 0) {
		return {}
	}
	if (!groupBy) {
		return {
			'': options,
		}
	}

	const groupOption: GroupOption = {}
	options.forEach(option => {
		const key = (option[groupBy] as string) || ''
		if (!groupOption[key]) {
			groupOption[key] = []
		}
		groupOption[key].push(option)
	})
	return groupOption
}

function removePickedOption(groupOption: GroupOption, picked: Option[]) {
	const cloneOption = JSON.parse(JSON.stringify(groupOption)) as GroupOption

	for (const [key, value] of Object.entries(cloneOption)) {
		cloneOption[key] = value.filter(
			val => !picked.find(p => p.value === val.value),
		)
	}
	return cloneOption
}

/**
 * The `CommandEmpty` of shadcn/ui will cause the cmdk empty not rendering correctly.
 * So we create one and copy the `Empty` implementation from `cmdk`.
 *
 * @reference: https://github.com/hsuanyi-chou/shadcn-ui-expansions/issues/34#issuecomment-1949561607
 **/
const CommandEmpty = forwardRef<
	HTMLDivElement,
	React.ComponentProps<typeof CommandPrimitive.Empty>
>(({ className, ...props }, forwardedRef) => {
	const render = useCommandState(state => state.filtered.count === 0)

	if (!render) return null

	return (
		<div
			ref={forwardedRef}
			className={cn('py-6 text-center text-sm', className)}
			cmdk-empty=""
			role="presentation"
			{...props}
		/>
	)
})

CommandEmpty.displayName = 'CommandEmpty'

const MultipleSelectorBase = React.forwardRef<
	MultipleSelectorRef,
	MultipleSelectorProps
>(
	(
		{
			value,
			onChange,
			placeholder,
			defaultOptions: arrayDefaultOptions = [],
			defaultValue = [],
			options: arrayOptions,
			delay,
			onSearch,
			loadingIndicator = (
				<p className="py-2 text-lg leading-10 text-center text-muted-foreground">
					chargement...
				</p>
			),
			emptyIndicator = (
				<p className="text-lg leading-10 text-center text-muted-foreground">
					Aucun résultat
				</p>
			),
			maxSelected = Number.MAX_SAFE_INTEGER,
			onMaxSelected,
			hidePlaceholderWhenSelected,
			disabled,
			groupBy,
			className,
			badgeClassName,
			selectFirstItem = true,
			creatable = false,
			triggerSearchOnFocus = false,
			commandProps,
			inputProps,
			testId,
			listPosition = 'top',
			selectAreaClassName,
		}: MultipleSelectorProps,
		ref: React.Ref<MultipleSelectorRef>,
	) => {
		const inputRef = React.useRef<HTMLInputElement>(null)
		const [open, setOpen] = React.useState(false)
		const [isLoading, setIsLoading] = React.useState(false)

		const [selected, setSelected] = React.useState<Option[]>(
			value || defaultValue,
		)
		const [options, setOptions] = React.useState<GroupOption>(
			transToGroupOption(arrayDefaultOptions, groupBy),
		)
		const [inputValue, setInputValue] = React.useState('')
		const debouncedSearchTerm = useDebounce(inputValue, delay || 500)

		React.useImperativeHandle(
			ref,
			() => ({
				selectedValue: [...selected],
				input: inputRef.current as HTMLInputElement,
				setInputValue: (value: string) => setInputValue(value),
			}),
			[selected],
		)

		const handleUnselect = React.useCallback(
			(option: Option) => {
				const newOptions = selected.filter(s => s.value !== option.value)
				setSelected(newOptions)
				onChange?.(newOptions)
			},
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[selected],
		)

		const handleKeyDown = React.useCallback(
			(e: React.KeyboardEvent<HTMLDivElement>) => {
				const input = inputRef.current
				if (input) {
					if (e.key === 'Delete' || e.key === 'Backspace') {
						if (input.value === '' && selected.length > 0) {
							handleUnselect(selected[selected.length - 1])
						}
					}
					// This is not a default behaviour of the <input /> field
					if (e.key === 'Escape') {
						input.blur()
					}
				}
			},
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[selected],
		)

		useEffect(() => {
			if (value) {
				setSelected(value)
			}
		}, [value])

		useEffect(() => {
			/** If `onSearch` is provided, do not trigger options updated. */
			if (!arrayOptions || onSearch) {
				return
			}
			const newOption = transToGroupOption(arrayOptions || [], groupBy)
			if (JSON.stringify(newOption) !== JSON.stringify(options)) {
				setOptions(newOption)
			}
		}, [arrayDefaultOptions, arrayOptions, groupBy, onSearch, options])

		useEffect(() => {
			const doSearch = async () => {
				setIsLoading(true)
				const res = await onSearch?.(debouncedSearchTerm)
				setOptions(transToGroupOption(res || [], groupBy))
				setIsLoading(false)
			}

			const exec = async () => {
				if (!onSearch || !open) return

				if (triggerSearchOnFocus || debouncedSearchTerm) {
					await doSearch()
				}
			}

			void exec()
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [debouncedSearchTerm, open])

		const CreatableItem = () => {
			if (!creatable) return undefined

			const Item = (
				<CommandItem
					value={inputValue}
					className="cursor-pointer"
					onMouseDown={e => {
						e.preventDefault()
						e.stopPropagation()
					}}
					onSelect={(value: string) => {
						if (selected.length >= maxSelected) {
							onMaxSelected?.(selected.length)
							return
						}
						setInputValue('')
						const newOptions = [...selected, { value, label: value }]
						setSelected(newOptions)
						onChange?.(newOptions)
					}}
				>{`Create "${inputValue}"`}</CommandItem>
			)

			// For normal creatable
			if (!onSearch && inputValue.length > 0) {
				return Item
			}

			// For async search creatable. avoid showing creatable item before loading at first.
			if (onSearch && debouncedSearchTerm.length > 0 && !isLoading) {
				return Item
			}

			return undefined
		}

		const EmptyItem = React.useCallback(() => {
			if (!emptyIndicator) return undefined

			// For async search that showing emptyIndicator
			if (onSearch && !creatable && Object.keys(options).length === 0) {
				return (
					<CommandItem value="-" disabled>
						{emptyIndicator}
					</CommandItem>
				)
			}

			return <CommandEmpty className="py-0"> {emptyIndicator}</CommandEmpty>
		}, [creatable, emptyIndicator, onSearch, options])

		const selectables = React.useMemo<GroupOption>(
			() => removePickedOption(options, selected),
			[options, selected],
		)

		/** Avoid Creatable Selector freezing or lagging when paste a long string. */
		const commandFilter = React.useCallback(() => {
			if (commandProps?.filter) {
				return commandProps.filter
			}

			if (creatable) {
				return (value: string, search: string) => {
					return value.toLowerCase().includes(search.toLowerCase()) ? 1 : -1
				}
			}
			// Using default filter in `cmdk`. We don't have to provide it.
			return undefined
		}, [creatable, commandProps?.filter])

		return (
			<Command
				{...commandProps}
				onKeyDown={e => {
					handleKeyDown(e)
					commandProps?.onKeyDown?.(e)
				}}
				className={cn(
					'overflow-visible bg-transparent',
					commandProps?.className,
				)}
				shouldFilter={
					commandProps?.shouldFilter !== undefined
						? commandProps.shouldFilter
						: !onSearch
				} // When onSearch is provided, we don't want to filter the options. You can still override it.
				filter={commandFilter()}
			>
				<div
					className={cn(
						'group rounded-md border border-input px-3 py-2 text-sm ring-offset-background',
						className,
					)}
				>
					<div className={cn('flex flex-wrap gap-1', selectAreaClassName)}>
						{selected.map(option => {
							return (
								<Badge
									key={option.value}
									className={cn(
										'data-[disabled]:bg-muted-foreground data-[disabled]:text-muted data-[disabled]:hover:bg-muted-foreground',
										'data-[fixed]:bg-muted-foreground data-[fixed]:text-muted data-[fixed]:hover:bg-muted-foreground opacity-100',
										badgeClassName,
									)}
									data-fixed={option.fixed}
									data-disabled={disabled}
									variant={'primary'}
								>
									{option.label}
									<button
										className={cn(
											'ml-1 -mr-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2',
											(disabled || option.fixed) && 'hidden',
										)}
										onKeyDown={e => {
											if (e.key === 'Enter') {
												handleUnselect(option)
											}
										}}
										onMouseDown={e => {
											e.preventDefault()
											e.stopPropagation()
										}}
										onClick={e => {
											if (
												(e.nativeEvent as MouseEvent & { pointerType: string })
													.pointerType === 'mouse'
											) {
												handleUnselect(option)
											} else {
												e.stopPropagation()
											}
										}}
									>
										<RiCloseLine className="w-4 h-4 text-black origin-center hover:scale-150 transition duration-125 ease-in-out hover:text-[#f50000]" />
									</button>
								</Badge>
							)
						})}
						{/* Avoid having the "Search" Icon */}
						<CommandPrimitive.Input
							{...inputProps}
							ref={inputRef}
							data-testid={`${testId}-input`}
							value={inputValue}
							disabled={disabled}
							onValueChange={value => {
								setInputValue(value)
								inputProps?.onValueChange?.(value)
							}}
							onBlur={event => {
								setOpen(false)
								inputProps?.onBlur?.(event)
							}}
							onFocus={event => {
								setOpen(true)
								triggerSearchOnFocus && onSearch?.(debouncedSearchTerm)
								inputProps?.onFocus?.(event)
							}}
							placeholder={
								hidePlaceholderWhenSelected && selected.length !== 0
									? ''
									: placeholder
							}
							className={cn(
								'ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground placeholder:opacity-50 text-black',
								inputProps?.className,
							)}
						/>
					</div>
				</div>
				<div className="relative mt-2">
					{open && (
						<CommandList
							className={`absolute ${listPosition === 'top' ? 'bottom-14' : 'top-0'} z-10 w-full border rounded-md shadow-md outline-none bg-popover text-popover-foreground animate-in`}
							onMouseDown={e => {
								e.preventDefault()
								e.stopPropagation()
							}}
						>
							{isLoading ? (
								// eslint-disable-next-line react/jsx-no-useless-fragment
								<>{loadingIndicator}</>
							) : (
								<>
									{EmptyItem()}
									{CreatableItem()}
									{!selectFirstItem && (
										<CommandItem value="-" className="hidden" />
									)}
									{Object.entries(selectables).map(([key, dropdowns]) => (
										<CommandGroup
											key={key}
											heading={key}
											className={`h-full overflow-auto ${
												dropdowns.length === 0 && 'p-0'
											}`}
										>
											<>
												{dropdowns.map(option => {
													return (
														<CommandItem
															key={option.value}
															value={option.value}
															disabled={option.disable}
															onMouseDown={e => {
																e.preventDefault()
																e.stopPropagation()
															}}
															onSelect={() => {
																if (selected.length >= maxSelected) {
																	onMaxSelected?.(selected.length)
																	return
																}
																setInputValue('')
																const newOptions = [...selected, option]
																setSelected(newOptions)
																onChange?.(newOptions)
															}}
															className={cn(
																'cursor-pointer',
																option.disable &&
																	'cursor-default text-muted-foreground',
															)}
														>
															{option.label}
														</CommandItem>
													)
												})}
											</>
										</CommandGroup>
									))}
								</>
							)}
						</CommandList>
					)}
				</div>
			</Command>
		)
	},
)

MultipleSelectorBase.displayName = 'MultipleSelectorBase'

interface FieldProps extends MultipleSelectorProps {
	label?: string
	errorClassName?: string
	withError?: boolean
	field: FieldMetadata<string | number>
	labelProps?: React.ComponentProps<typeof Label>
}

const MultipleSelector = React.forwardRef<MultipleSelectorRef, FieldProps>(
	({ label, field, labelProps, errorClassName, withError, ...props }, ref) => {
		return (
			<div className="form-control">
				{label && (
					<Label
						{...labelProps}
						className={cn(
							{ 'label-required': field.required },
							labelProps?.className,
						)}
						htmlFor={field.id}
					>
						{label}
					</Label>
				)}
				<div className="mt-1">
					<MultipleSelectorBase
						onChange={props.onChange}
						ref={ref}
						{...props}
					/>
				</div>
				<InputField
					inputProps={{ hidden: true }}
					withError={false}
					field={field}
					type="text"
				/>
			</div>
		)
	},
)

MultipleSelector.displayName = 'MultipleSelector'

export { MultipleSelector }
