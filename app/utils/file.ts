export async function getFileBufferAndPath(file: File, folder: string) {
	const fileBuffer = await file.arrayBuffer()
	const extension = file.name.split('.').pop()
	const filePath = `${folder}/${Date.now()}.${extension}`

	return { fileBuffer, filePath }
}
