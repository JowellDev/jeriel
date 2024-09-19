import { RiFileExcel2Line } from '@remixicon/react'
import { useRef, useState, type ChangeEvent } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface Props {
	onFileChange?: (file: File | null) => void
	name: string
	modelFilePath?: string
	className?: string
}

export default function ExcelFileUploadField({
	onFileChange,
	name,
	modelFilePath = '/uploads/member-model.xlsx',
	className,
}: Props) {
	const [fileName, setFileName] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [fileError, setFileError] = useState<string | null>(null)

	const handleClick = () => {
		fileInputRef.current?.click()
	}

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
		<div className={className}>
			<div
				className="border-2 flex flex-col mt-1 items-center border-dashed border-gray-400 py-5 cursor-pointer"
				onClick={handleClick}
			>
				<div className="flex flex-col items-center">
					<RiFileExcel2Line
						color={fileName ? '#226C67' : '#D1D1D1'}
						size={30}
					/>
					<p className="text-xs font-light mt-3">
						{fileName ?? 'Importer uniquement un fichier de type Excel'}
					</p>
				</div>

				<Input
					type="file"
					className="hidden"
					name={name}
					ref={fileInputRef}
					onChange={handleFileChange}
					accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
				/>
			</div>
			{fileError && (
				<div className="text-red-500 text-center text-xs mt-1">{fileError}</div>
			)}
			<a href={modelFilePath} download data-testid="download-link">
				<Button
					variant="ghost"
					type="button"
					className="text-xs font-light border-none text-[#D1D1D1]-100 hover:bg-gray-100 hover:text-[#D1D1D1]-100"
				>
					<RiFileExcel2Line className="mr-2" color="#D1D1D1" size={20} />{' '}
					Télécharger le modèle de fichier
				</Button>
			</a>
		</div>
	)
}
