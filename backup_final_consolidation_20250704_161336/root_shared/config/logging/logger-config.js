/**
 * Logger Configuration for Renexus
 * 
 * This module configures Winston logger with different transports based on the environment.
 */

const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const { format } = winston;

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Console format for development
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Configure file rotation settings
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'renexus-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat
});

// Error file rotation settings
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'renexus-error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
  format: logFormat
});

// Create a logger based on environment
const createLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || (env === 'production' ? 'warn' : 'debug');
  const logOutput = process.env.LOG_OUTPUT || (env === 'development' ? 'console' : 'file');
  
  const transports = [];
  
  // Add console transport in development or if specified
  if (env === 'development' || logOutput === 'console') {
    transports.push(new winston.transports.Console({
      level: logLevel,
      format: consoleFormat
    }));
  }
  
  // Add file transports in non-development or if specified
  if (env !== 'development' || logOutput === 'file') {
    transports.push(fileRotateTransport);
    transports.push(errorFileRotateTransport);
  }
  
  return winston.createLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service: 'renexus-api' },
    transports
  });
};

// Create and export the configured logger
const logger = createLogger();

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({ 
    filename: path.join(logsDir, 'exceptions.log'),
    format: logFormat
  })
);

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
});

module.exports = logger;
