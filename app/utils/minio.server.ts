import * as Minio from 'minio'

declare global {
	// eslint-disable-next-line no-var
	var minio: Minio.Client | undefined
}

let minioInstance: Minio.Client | null = null

async function createMinioClient(): Promise<Minio.Client> {
	const {
		MINIO_HOST = 'localhost',
		MINIO_PORT = '9000',
		MINIO_ACCESS_KEY = 'jeriel',
		MINIO_SECRET_KEY = 'jeriel',
		MINIO_BUCKET = 'jeriel',
	} = process.env

	const client = new Minio.Client({
		endPoint: MINIO_HOST,
		port: +MINIO_PORT,
		accessKey: MINIO_ACCESS_KEY,
		secretKey: MINIO_SECRET_KEY,
		useSSL: false,
	})

	const exists = await client.bucketExists(MINIO_BUCKET)

	if (!exists) {
		await client.makeBucket(MINIO_BUCKET)
	}

	return client
}

export async function getMinio(): Promise<Minio.Client> {
	if (minioInstance) return minioInstance

	if (global.minio) {
		minioInstance = global.minio
	} else {
		minioInstance = await createMinioClient()

		if (process.env.NODE_ENV !== 'production') {
			global.minio = minioInstance
		}
	}

	return minioInstance
}
