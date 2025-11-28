import { getFileBufferAndPath } from './file'
import { uploadFile } from '~/helpers/storage'

export async function saveMemberPicture(image: File) {
	const folder = 'pictures'
	const data = await getFileBufferAndPath(image, folder)
	const { fileBuffer, filePath } = data

	return uploadFile(filePath, Buffer.from(fileBuffer), image.size, {
		'content-type': image.type,
	})
}
