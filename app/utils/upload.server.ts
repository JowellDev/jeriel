import { minio } from '~/utils/minio.server'

export async function uploadFile(
	filePath: string,
	file: Buffer,
	size: number,
	metadata: Record<string, string | number>,
) {
	const {
		MINIO_HOST = 'localhost',
		MINIO_PORT = '9000',
		MINIO_BUCKET = 'jeriel',
	} = process.env

	await minio.putObject(MINIO_BUCKET, filePath, file, size, metadata)

	return `http://${MINIO_HOST}:${MINIO_PORT}/${MINIO_BUCKET}/${filePath}`
}

export function getFile(filePath: string, storagePath: string) {
	const { MINIO_BUCKET = 'jeriel' } = process.env

	return minio.fGetObject(MINIO_BUCKET, filePath, storagePath)
}

export function getFileStats(filePath: string) {
	const { MINIO_BUCKET = 'jeriel' } = process.env

	return minio.statObject(MINIO_BUCKET, filePath)
}

export function deleteFile(filePath: string) {
	const { MINIO_BUCKET = 'jeriel' } = process.env

	return minio.removeObject(MINIO_BUCKET, filePath)
}
