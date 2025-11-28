import { createClient } from 'redis'

declare global {
	// eslint-disable-next-line no-var
	var redis: ReturnType<typeof getRedisClient>
}

export const redis = global.redis || getRedisClient()

function getRedisClient() {
	const { REDIS_URL = 'redis://localhost:6379', REDIS_PASSWORD } = process.env

	const client = createClient({
		url: REDIS_URL,
		password: REDIS_PASSWORD,
		database: 0,
	})

	client.on('error', err => {
		console.error(err)
	})

	client.connect()

	return client
}
