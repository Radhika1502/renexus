import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  logger.error(`Error: ${message}`, {
    error: err,
    path: req.path,
    method: req.method,
    ip: req.ip,
    statusCode: status,
  });

  // Send response
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message,
      details: err.details || undefined,
    },
  });
};
