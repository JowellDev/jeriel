import { RiFileExcel2Line } from '@remixicon/react'
import { useRef, useState, type ChangeEvent } from 'react'

import { cn } from '~/utils/ui'
import { ACCEPTED_EXCEL_MIME_TYPES } from '~/shared/constants'

import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface Props {
	name: string
	className?: string
	modelFilePath?: string
	onFileChange?: (file: File | null) => void
}

export default function ExcelFileUploadField({
	name,
	className,
	modelFilePath = '/uploads/entity_members_model.xlsx',
	onFileChange,
}: Readonly<Props>) {
	const [fileName, setFileName] = useState<string | null>(null)
	const [fileError, setFileError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
		} else {
			setFileName(file.name)
			onFileChange?.(file)
		}
	}

	return (
		<div className={cn('grid gap-2', className)}>
			<div
				className="border-2 flex flex-col mt-1 items-center border-dashed border-border py-5 cursor-pointer hover:bg-muted duration-200"
				onClick={() => fileInputRef.current?.click()}
			>
				<div className="flex flex-col items-center">
					<RiFileExcel2Line
						color={
							fileName ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
						}
						size={35}
					/>
					<p className="text-xs font-light mt-3">
						{fileName ?? 'Cliquez pour charger votre fichier'}
					</p>
				</div>

				<Input
					type="file"
					className="hidden"
					name={name}
					ref={fileInputRef}
					onChange={handleFileChange}
					accept={ACCEPTED_EXCEL_MIME_TYPES.join(',')}
				/>
			</div>
			{fileError && (
				<div className="text-red-500 text-center text-xs mt-1">{fileError}</div>
			)}

			{modelFilePath && (
				<div>
					<a href={modelFilePath} download>
						<Button
							type="button"
							variant="ghost"
							className="text-xs font-light border-none text-muted-foreground hover:bg-muted hover:text-muted-foreground"
						>
							<RiFileExcel2Line
								className="mr-2"
								color="hsl(var(--muted-foreground))"
								size={23}
							/>{' '}
							Télécharger le modèle de fichier
						</Button>
					</a>
				</div>
			)}
		</div>
	)
}
