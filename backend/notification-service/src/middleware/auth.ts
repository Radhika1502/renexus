import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Verify JWT token middleware
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Token format invalid' });
    }
    
    const token = parts[1];
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Authentication service misconfigured' });
    }
    
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        logger.error('Token verification failed', { error: err.message });
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      // Add user info to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Check if user has admin role
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Admin privileges required' });
  }
};

/**
 * Check if user has specific role
 */
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied: Insufficient privileges' });
    }
  };
};
