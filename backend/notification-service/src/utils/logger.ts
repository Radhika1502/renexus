import winston from 'winston';
import * as dotenv from 'dotenv';

dotenv.config();

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log format for console output
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${level}]: ${message} ${metaString}`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'notification-service' },
  transports: [
    // Console transport with colorized output
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        consoleFormat
      )
    }),
    // File transport for error logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // File transport for all logs
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Export a stream object for Morgan middleware
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};
