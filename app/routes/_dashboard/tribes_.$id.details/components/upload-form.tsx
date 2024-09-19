import * as React from 'react'
import { useMediaQuery } from 'usehooks-ts'

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '~/components/ui/drawer'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils/ui'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useFetcher } from '@remix-run/react'
import { FORM_INTENT } from '../constants'
import { type ActionType } from '../action.server'
import { useEffect, useRef, useState } from 'react'
import { Input } from '~/components/ui/input'
import { RiFileExcelLine } from '@remixicon/react'

interface Props {
	onClose: () => void
}

export function UploadFormDialog({ onClose }: Readonly<Props>) {
	const fetcher = useFetcher<ActionType>()
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = 'Importation de fidèles'

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						isLoading={isSubmitting}
						fetcher={fetcher}
						onClose={onClose}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onClose}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
				</DrawerHeader>
				<MainForm isLoading={isSubmitting} fetcher={fetcher} className="px-4" />
				<DrawerFooter className="pt-2">
					<DrawerClose asChild>
						<Button variant="outline">Fermer</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}

function MainForm({
	className,
	isLoading,
	fetcher,
	onClose,
}: React.ComponentProps<'form'> & {
	isLoading: boolean
	fetcher: ReturnType<typeof useFetcher<ActionType>>
	onClose?: () => void
}) {
	const [fileName, setFileName] = useState<string | null>(null)
	const [fileError, setFileError] = useState<string | null>(null)
	const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleClick = () => {
		fileInputRef.current?.click()
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFileError(null)
		setFileName(null)
		const files = e.target.files
		if (files && files.length > 0) {
			validateFiles(files)
		}
	}

	const validateFiles = (files: FileList) => {
		const file = files[0]
		const fileType = file.name.split('.').pop() ?? ''

		if (!['xlsx'].includes(fileType)) {
			setFileError('Le fichier doit être de type Excel')
			setFileName(null)
		}
		setFileName(file.name)
	}

	const handleDownloadLink = () => {
		setIsDownloadingTemplate(true)

		const downloadLink = document.querySelector(
			'[data-testid="download-link"]',
		) as HTMLAnchorElement

		downloadLink.click()
	}

	useEffect(() => {
		if (fetcher.data?.success) {
			onClose?.()
		}
	}, [fetcher.data, onClose])

	return (
		<fetcher.Form
			method="post"
			className={cn('grid items-start gap-4', className)}
			encType="multipart/form-data"
		>
			<div
				className="border-2 flex flex-col mt-1 items-center border-dashed border-gray-400 py-20 cursor-pointer"
				onClick={handleClick}
			>
				<div className="flex flex-col items-center">
					<RiFileExcelLine
						color={`${fileName ? '#226C67' : '#D1D1D1'}`}
						size={80}
					/>
					<p className="text-sm mt-3">
						{fileName ?? 'Importer uniquement un fichier de type Excel'}
					</p>
				</div>

				<Input
					type="file"
					className="hidden"
					name="membersFile"
					ref={fileInputRef}
					onChange={handleFileChange}
					accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
				/>
			</div>
			{fileError && (
				<div className="text-red-500 text-center text-sm m-auto">
					{fileError}
				</div>
			)}
			<div className="flex items-center">
				<RiFileExcelLine color="#D1D1D1" size={35} />

				<a
					href="/uploads/member-model.xlsx"
					download
					data-testid="download-link"
					className="hidden"
				>
					{}
				</a>
				<Button
					data-testid="download-btn"
					variant="ghost"
					type="button"
					className="border-none text-[#D1D1D1]-100 hover:bg-gray-100 hover:text-[#D1D1D1]-100"
					onClick={handleDownloadLink}
				>
					Télécharger le modèle de fichier
				</Button>
			</div>

			<div className="sm:flex sm:justify-end sm:space-x-4 mt-4">
				{onClose && (
					<Button type="button" variant="outline" onClick={onClose}>
						Fermer
					</Button>
				)}
				<Button
					type="submit"
					value={FORM_INTENT.UPLOAD}
					name="intent"
					variant="primary"
					disabled={isLoading || isDownloadingTemplate}
					className="w-full sm:w-auto"
				>
					Enregister
				</Button>
			</div>
		</fetcher.Form>
	)
}
