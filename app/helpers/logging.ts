import * as winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const { combine, timestamp, errors, splat, json, printf, colorize, align } =
	winston.format

export const appLogger = winston.createLogger({
	format: combine(errors({ stack: true })),
	transports: [
		new winston.transports.Console({
			level: process.env.LOG_LEVEL ?? 'info',
			format: combine(
				colorize({ all: true }),
				timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
				splat(),
				json(),
				printf(({ level, message, timestamp, module, extra }) => {
					return `${timestamp} [${module}] ${level}: ${message}\n${JSON.stringify(extra)}`
				}),
			),
		}),
		new DailyRotateFile({
			dirname: 'logs',
			filename: 'error-%DATE%.log',
			datePattern: 'YYYY-MM-DD',
			zippedArchive: true,
			maxSize: '20m',
			maxFiles: '14d',
			level: 'error',
			format: combine(
				timestamp(),
				errors({ stack: true }),
				splat(),
				json(),
				align(),
				printf(({ level, message, timestamp, module, stack, ...rest }) => {
					return `${timestamp} [${module}] ${level}: ${message} - ${stack}\n metadata: ${JSON.stringify(rest)}`
				}),
			),
		}),
	],
})
