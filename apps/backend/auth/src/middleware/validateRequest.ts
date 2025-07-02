import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const error = {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors.array(),
    };
    
    next(error);
    return;
  }
  
  next();
};
