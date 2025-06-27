import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@renexus/api-types';

/**
 * Middleware to check if user has required role
 */
export const checkRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { role: UserRole } | undefined;
    
    if (!user) {
      return next({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }
    
    if (!roles.includes(user.role)) {
      return next({
        status: 403,
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }
    
    next();
  };
};
