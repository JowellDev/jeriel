import { getFileBufferAndPath } from '../utils/file'
import { uploadFile } from '~/helpers/storage'

export async function saveMemberPicture(image: File) {
	const data = await getFileBufferAndPath(image, 'pictures')
	const { fileBuffer, filePath } = data

	return uploadFile(filePath, Buffer.from(fileBuffer), image.size, {
		'content-type': image.type,
	})
}
