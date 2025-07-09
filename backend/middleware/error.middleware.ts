import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Custom error classes
export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends ApiError {
  errors: string[];
  constructor(message: string, errors: string[] = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

// Request tracking middleware
export const requestTracker = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.id = uuidv4();
  next();
};

// Enhanced error logging
const logError = (err: any, req: Request) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: req.id,
    path: req.originalUrl,
    method: req.method,
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack,
    body: req.body,
    query: req.query,
    params: req.params
  };

  console.error('[ERROR]', JSON.stringify(errorLog, null, 2));
};

/**
 * Centralized error handling middleware
 * Standardizes error responses across the API
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error with enhanced details
  logError(err, req);

  // Default error status and message
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Error response structure
  const errorResponse = {
    status: 'error',
    statusCode: status,
    message,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add validation errors if present
  if (err instanceof ValidationError) {
    Object.assign(errorResponse, { errors: err.errors });
  }

  // Include stack trace in development environment only
  if (process.env.NODE_ENV !== 'production') {
    Object.assign(errorResponse, { stack: err.stack });
  }

  // Send standardized error response
  res.status(status).json(errorResponse);
};

/**
 * 404 Not Found middleware
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response
) => {
  const notFoundResponse = {
    status: 'error',
    statusCode: 404,
    message: `Route not found: ${req.originalUrl}`,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  res.status(404).json(notFoundResponse);
};
