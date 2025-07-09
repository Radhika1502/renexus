import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'A resource with this identifier already exists'
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Resource not found'
        });
      case 'P2003':
        return res.status(400).json({
          error: 'Invalid foreign key constraint'
        });
      default:
        return res.status(400).json({
          error: 'Database operation failed'
        });
    }
  }

  if (err instanceof SyntaxError) {
    return res.status(400).json({
      error: 'Invalid request syntax'
    });
  }

  res.status(500).json({
    error: 'Internal server error'
  });
}; 