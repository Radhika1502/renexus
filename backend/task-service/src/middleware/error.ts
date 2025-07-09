import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma errors
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'A resource with this identifier already exists'
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Resource not found'
        });
      default:
        return res.status(400).json({
          error: 'Database operation failed'
        });
    }
  }

  res.status(500).json({
    error: 'Internal server error'
  });
}; 