import EventEmitter from 'node:events'

let emitter: EventEmitter

declare global {
	// eslint-disable-next-line no-var
	var __emitter: EventEmitter | undefined
}

if (process.env.NODE_ENV === 'production') {
	emitter = new EventEmitter()
} else {
	if (!global.__emitter) {
		global.__emitter = new EventEmitter()
	}

	emitter = global.__emitter
}

export { emitter }
