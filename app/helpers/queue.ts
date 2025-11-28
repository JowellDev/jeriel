import { Queue, QueueEvents, Worker, type Processor } from 'bullmq'
import { appLogger } from '~/helpers/logging'

const logger = appLogger.child({ module: 'bullmq' })

type QueueWithEvents<T> = Queue<T> & { events: QueueEvents }

type RegisteredQueue = {
	queue: Queue
	queueEvents: QueueEvents
	worker: Worker
}

declare global {
	// eslint-disable-next-line no-var
	var registeredQueues: Record<string, RegisteredQueue> | undefined
}

const registeredQueues =
	global.registeredQueues ?? (global.registeredQueues = {})

function registerQueue<T>(
	name: string,
	processor: Processor<T> | string,
	opts?: {
		concurrency?: number
		rateLimit?: { max: number; duration: number }
		lockDuration?: number
	},
) {
	const {
		REDIS_HOST = 'localhost',
		REDIS_PORT = 6379,
		REDIS_PASSWORD,
	} = process.env

	const connection = {
		host: REDIS_HOST,
		port: +REDIS_PORT,
		password: REDIS_PASSWORD,
	}
	if (!registeredQueues[name]) {
		const queue = new Queue(name, {
			connection,
			defaultJobOptions: {
				attempts: 3,
				backoff: {
					type: 'exponential',
					delay: 3000,
				},
			},
		})

		queue.on('error', error =>
			logger.error(`an error occurred on queue ${name}`, { extra: { error } }),
		)

		const queueEvents = new QueueEvents(name, { connection })

		queueEvents.on('completed', job =>
			logger.info(`${name} job ${job.jobId} completed`),
		)

		queueEvents.on('failed', (job, error) =>
			logger.error(`${name} job ${job.jobId} failed - ${job.failedReason}`, {
				extra: { error },
			}),
		)

		const worker = new Worker<T>(name, processor, {
			connection,
			lockDuration: opts?.lockDuration ?? 1000 * 60 * 10, // 10 minutes
			concurrency: opts?.concurrency ?? 8,
			removeOnComplete: {
				age: 1 * 60 * 60, // 1h
			},
			removeOnFail: {
				age: 24 * 60 * 60, // 24h
			},
			limiter: opts?.rateLimit,
		})

		worker.on('error', error => {
			logger.error(`An error occurred on worker ${name}`, { extra: { error } })
		})

		registeredQueues[name] = { queue, queueEvents, worker }
	}

	const queue = registeredQueues[name].queue as QueueWithEvents<T>
	queue.events = registeredQueues[name].queueEvents

	return queue
}

export { logger as bullmqLogger, registerQueue }
