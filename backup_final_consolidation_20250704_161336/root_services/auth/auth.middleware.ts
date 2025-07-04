import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      tenantId: string;
      email: string;
      role: string;
    };
    
    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to ensure user has access to the requested tenant
 */
export const requireTenantAccess = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if tenant ID is in request params or query
    const requestedTenantId = req.params.tenantId || req.query.tenantId;
    
    // If a specific tenant is requested, check access
    if (requestedTenantId && requestedTenantId !== req.user.tenantId) {
      // Allow super admins to access any tenant
      if (req.user.role === 'super_admin') {
        next();
        return;
      }
      
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }
    
    next();
  } catch (error) {
    console.error('Tenant access error:', error);
    return res.status(500).json({ error: 'Error checking tenant access' });
  }
};

/**
 * Middleware to ensure user has required role(s)
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};
