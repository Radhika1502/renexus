import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

export async function errorHandler(
  error: any,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error(error.message || 'Unknown error occurred');

  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    });
  }

  // Handle custom application errors
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      error: error.name || 'Application Error',
      message: error.message,
    });
  }

  // Handle database errors
  if (error.code === '23505') {
    return reply.status(409).send({
      error: 'Conflict',
      message: 'Resource already exists',
    });
  }

  // Default error response
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
} 