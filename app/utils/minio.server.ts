import * as Minio from 'minio'

declare global {
	// eslint-disable-next-line no-var
	var minio: Minio.Client
}

export const minio = global.minio || (await getMinioClient())

if (process.env['NODE_ENV'] !== 'production') {
	global.minio = await getMinioClient()
}

async function getMinioClient() {
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
