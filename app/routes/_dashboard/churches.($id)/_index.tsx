import { useEffect, useState } from 'react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { InputSearch } from '~/components/ui/input-search'
import { ChurchesFormDialog } from './components/churches-form-dialog'
import { ChurchTable } from './components/churches-table'
import { actionFn } from './action.server'
import type { Church } from './model'
import { loaderFn, type LoaderType } from './loader.server'
import {
	useFetcher,
	useLoaderData,
	useLocation,
	useSearchParams,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'

export const loader = loaderFn
export const action = actionFn

export default function Church() {
	const [open, setOpen] = useState(false)
	const [selectedChurch, setSelectedChurch] = useState<Church | undefined>(
		undefined,
	)
	const { churches, query } = useLoaderData<typeof loader>()
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const location = useLocation()
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const handleEdit = (church: Church) => {
		setSelectedChurch(church)
		setOpen(true)
	}

	const handleClose = () => {
		setOpen(false)
		setSelectedChurch(undefined)
		load(`${location.pathname}?${searchParams}`)
	}

	const handleSearch = (searchQuery: string) => {
		debounced({ query: searchQuery })
	}

	useEffect(() => {
		if (searchParams.toString()) {
			load(`${location.pathname}?${searchParams.toString()}`)
		}
	}, [searchParams, location.pathname, load])

	return (
		<MainContent
			headerChildren={
				<Header title="Gestion d'églises">
					<div className="sm:w-64">
						<fetcher.Form>
							<InputSearch
								defaultValue={query}
								onSearch={handleSearch}
								placeholder="Recherche..."
							/>
						</fetcher.Form>
					</div>
					<Button variant={'gold'} onClick={() => setOpen(true)}>
						Créer une église
					</Button>
				</Header>
			}
		>
			<ChurchTable
				data={fetcher.data?.churches || churches}
				onEdit={handleEdit}
			/>
			{open && (
				<ChurchesFormDialog onClose={handleClose} church={selectedChurch} />
			)}
		</MainContent>
	)
}
