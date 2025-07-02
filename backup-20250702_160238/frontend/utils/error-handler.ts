import express from 'express';

// Using express types directly
type Request = any; // Express.Request
type Response = any; // Express.Response
type NextFunction = (err?: any) => void;

/**
 * Custom API error class with status code
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types for consistent error handling
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

export class ValidationError extends ApiError {
  errors: any;
  
  constructor(message: string = 'Validation failed', errors: any = null) {
    super(message, 422);
    this.errors = errors;
  }
}

/**
 * Async error handler wrapper to avoid try/catch blocks in route handlers
 * @param fn Route handler function
 * @returns Wrapped route handler with error handling
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Format the response
  const errorResponse = {
    status: 'error',
    message,
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
  };
  
  // Add validation errors if present
  if (err instanceof ValidationError && err.errors) {
    Object.assign(errorResponse, { errors: err.errors });
  }
  
  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    Object.assign(errorResponse, { stack: err.stack });
  }
  
  res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler middleware for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
};
