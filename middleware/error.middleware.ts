import express from 'express';

/**
 * Centralized error handling middleware
 * Standardizes error responses across the API
 */
export const errorHandler = (
  err: any, 
  req: any, 
  res: any, 
  next: any
) => {
  // Log error for debugging
  console.error(`[ERROR] ${err.message || 'Unknown error'}`);
  console.error(err.stack);

  // Default error status and message
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Error response structure
  const errorResponse = {
    status: 'error',
    statusCode: status,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    // Include stack trace in development environment only
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  // Send standardized error response
  res.status(status).json(errorResponse);
};

/**
 * 404 Not Found middleware
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (
  req: any, 
  res: any
) => {
  const notFoundResponse = {
    status: 'error',
    statusCode: 404,
    message: `Route not found: ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  res.status(404).json(notFoundResponse);
};
