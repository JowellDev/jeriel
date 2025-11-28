import { getMinio } from '~/infrastructures/storage/minio.server'

export async function uploadFile(
	filePath: string,
	file: Buffer,
	size: number,
	metadata: Record<string, string | number>,
) {
	const minio = await getMinio()

	const { MINIO_URL = 'http://localhost:9000', MINIO_BUCKET = 'jeriel' } =
		process.env

	await minio.putObject(MINIO_BUCKET, filePath, file, size, metadata)

	return `${MINIO_URL}/${MINIO_BUCKET}/${filePath}`
}

export async function getFile(filePath: string, storagePath: string) {
	const minio = await getMinio()

	const { MINIO_BUCKET = 'jeriel' } = process.env

	return minio.fGetObject(MINIO_BUCKET, filePath, storagePath)
}

export async function getFileStats(filePath: string) {
	const minio = await getMinio()
	const { MINIO_BUCKET = 'jeriel' } = process.env

	return minio.statObject(MINIO_BUCKET, filePath)
}

export async function deleteFile(filePath: string) {
	const minio = await getMinio()
	const { MINIO_BUCKET = 'jeriel' } = process.env

	return minio.removeObject(MINIO_BUCKET, filePath)
}
