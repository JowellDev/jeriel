import { Queue, QueueEvents, Worker, type Processor } from 'bullmq'
import { appLogger } from './logging'
import { JOB_CONFIG } from '~/shared/constants'

const logger = appLogger.child({ module: 'bullmq' })

const QUEUE_DEFAULTS = {
	REDIS_HOST: 'localhost',
	REDIS_PORT: 6379,
	JOB_ATTEMPTS: JOB_CONFIG.MAX_RETRY_ATTEMPTS,
	BACKOFF_DELAY_MS: JOB_CONFIG.BACKOFF_DELAY_MS,
	LOCK_DURATION_MS: JOB_CONFIG.LOCK_DURATION_MS,
	WORKER_CONCURRENCY: JOB_CONFIG.WORKER_CONCURRENCY,
	COMPLETED_JOB_RETENTION_SECONDS: 60 * 60, // 1 hour
	FAILED_JOB_RETENTION_SECONDS: 24 * 60 * 60, // 24 hours
} as const

type QueueWithEvents<T> = Queue<T> & { events: QueueEvents }

type RegisteredQueue = {
	queue: Queue
	queueEvents: QueueEvents
	worker: Worker
}

type RedisConnection = {
	host: string
	port: number
	password: string | undefined
}

declare global {
	// eslint-disable-next-line no-var
	var registeredQueues: Record<string, RegisteredQueue> | undefined
}

const registeredQueues =
	global.registeredQueues ?? (global.registeredQueues = {})

function getRedisConnection(): RedisConnection {
	const {
		REDIS_HOST = QUEUE_DEFAULTS.REDIS_HOST,
		REDIS_PORT = QUEUE_DEFAULTS.REDIS_PORT,
		REDIS_PASSWORD,
	} = process.env

	return {
		host: REDIS_HOST,
		port: Number(REDIS_PORT),
		password: REDIS_PASSWORD,
	}
}

function createQueue(name: string, connection: RedisConnection): Queue {
	const queue = new Queue(name, {
		connection,
		defaultJobOptions: {
			attempts: QUEUE_DEFAULTS.JOB_ATTEMPTS,
			backoff: {
				type: 'exponential',
				delay: QUEUE_DEFAULTS.BACKOFF_DELAY_MS,
			},
		},
	})

	queue.on('error', error =>
		logger.error(`Queue error occurred: ${name}`, { error }),
	)

	return queue
}

function createQueueEvents(
	name: string,
	connection: RedisConnection,
): QueueEvents {
	const queueEvents = new QueueEvents(name, { connection })

	queueEvents.on('completed', job =>
		logger.info(`Job completed: ${name}/${job.jobId}`),
	)

	queueEvents.on('failed', (job, error) =>
		logger.error(`Job failed: ${name}/${job.jobId} - ${job.failedReason}`, {
			error,
		}),
	)

	return queueEvents
}

function createWorker<T>(
	name: string,
	processor: Processor<T> | string,
	connection: RedisConnection,
): Worker<T> {
	const worker = new Worker<T>(name, processor, {
		connection,
		lockDuration: QUEUE_DEFAULTS.LOCK_DURATION_MS,
		concurrency: QUEUE_DEFAULTS.WORKER_CONCURRENCY,
		removeOnComplete: {
			age: QUEUE_DEFAULTS.COMPLETED_JOB_RETENTION_SECONDS,
		},
		removeOnFail: {
			age: QUEUE_DEFAULTS.FAILED_JOB_RETENTION_SECONDS,
		},
	})

	worker.on('error', error =>
		logger.error(`Worker error occurred: ${name}`, { error }),
	)

	return worker
}

function isQueueRegistered(name: string): boolean {
	return name in registeredQueues
}

function initializeQueue<T>(
	name: string,
	processor: Processor<T> | string,
	connection: RedisConnection,
): void {
	const queue = createQueue(name, connection)
	const queueEvents = createQueueEvents(name, connection)
	const worker = createWorker<T>(name, processor, connection)

	registeredQueues[name] = { queue, queueEvents, worker }
}

function getQueueWithEvents<T>(name: string): QueueWithEvents<T> {
	const registeredQueue = registeredQueues[name]
	const queue = registeredQueue.queue as QueueWithEvents<T>
	queue.events = registeredQueue.queueEvents

	return queue
}

function registerQueue<T>(
	name: string,
	processor: Processor<T> | string,
): QueueWithEvents<T> {
	if (!isQueueRegistered(name)) {
		const connection = getRedisConnection()
		initializeQueue<T>(name, processor, connection)
	}

	return getQueueWithEvents<T>(name)
}

export { logger as bullmqLogger, registerQueue }
