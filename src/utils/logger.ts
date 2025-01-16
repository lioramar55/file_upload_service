import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const logDir = 'logs';
const isDevelopment = process.env.NODE_ENV === 'development';

// Define log format
const logFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.json(),
	winston.format.printf(({ timestamp, level, message, ...meta }) => {
		return JSON.stringify({
			timestamp,
			level,
			message,
			...meta,
		});
	})
);

// Create rotating file transport
const fileRotateTransport = new winston.transports.DailyRotateFile({
	filename: path.join(logDir, '%DATE%-app.log'),
	datePattern: 'YYYY-MM-DD',
	maxSize: '20m',
	maxFiles: '14d',
	zippedArchive: true,
});

// Create logger instance
const logger = winston.createLogger({
	level: isDevelopment ? 'debug' : 'info',
	format: logFormat,
	transports: [
		fileRotateTransport,
		new winston.transports.Console({
			format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
		}),
	],
});

export default logger;
