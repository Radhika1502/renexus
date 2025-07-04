import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger, transports, format, Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
        format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            context,
            trace,
            ...meta,
          });
        }),
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${level}] ${context ? `[${context}] ` : ''}${message}`;
            }),
          ),
        }),
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // API Gateway specific logging methods
  logRequest(method: string, url: string, userAgent?: string, ip?: string) {
    this.logger.info('Incoming request', {
      context: 'HTTP',
      method,
      url,
      userAgent,
      ip,
    });
  }

  logResponse(method: string, url: string, statusCode: number, responseTime: number) {
    this.logger.info('Outgoing response', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
    });
  }

  logServiceCall(service: string, endpoint: string, success: boolean, responseTime?: number) {
    this.logger.info(`Service call to ${service}`, {
      context: 'SERVICE_CALL',
      service,
      endpoint,
      success,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
    });
  }

  logAuthentication(userId: string, action: string, success: boolean, ip?: string) {
    this.logger.info(`Authentication ${action}`, {
      context: 'AUTH',
      userId,
      action,
      success,
      ip,
    });
  }

  logRateLimit(ip: string, endpoint: string, remaining: number) {
    this.logger.warn('Rate limit check', {
      context: 'RATE_LIMIT',
      ip,
      endpoint,
      remaining,
    });
  }
}