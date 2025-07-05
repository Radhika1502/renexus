import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from "../utils/logger";

interface ExtendedUser {
  id: string;
  email: string;
  tenantId?: string;
  role?: string;
  tenantRole?: string;
}

interface JwtPayload {
  id: string;
  email: string;
  tenantId?: string;
  role?: string;
  tenantRole?: string;
  [key: string]: any;
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
      
      // Type guard and assign user info to request
      if (decoded && typeof decoded === 'object' && 'id' in decoded && 'email' in decoded) {
        const payload = decoded as JwtPayload;
        const user: ExtendedUser = {
          id: payload.id,
          email: payload.email,
          tenantId: payload.tenantId,
          role: payload.role || payload.tenantRole || 'user',
          tenantRole: payload.tenantRole || payload.role || 'user'
        };
        
        // Use type assertion to assign to req.user
        (req as any).user = user;
        next();
      } else {
        return res.status(401).json({ error: 'Invalid token payload' });
      }
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
  const user = (req as any).user as ExtendedUser;
  if (user && (user.role === 'admin' || user.tenantRole === 'admin')) {
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
    const user = (req as any).user as ExtendedUser;
    const userRole = user?.role || user?.tenantRole;
    if (user && userRole && roles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied: Insufficient privileges' });
    }
  };
};

