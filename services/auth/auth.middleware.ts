import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { db } from '../../database/db';
import { tenantUsers } from '../../database/schema/unified_schema';
import { and, eq } from 'drizzle-orm';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = authService.verifyToken(token) as any;
    
    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

/**
 * Tenant access middleware
 * Ensures user has access to the requested tenant
 */
export const requireTenantAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get tenant ID from request params or query
    const tenantId = req.params.tenantId || req.query.tenantId as string;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }
    
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    
    // Check if user belongs to tenant
    const tenantUser = await db.query.tenantUsers.findFirst({
      where: and(
        eq(tenantUsers.userId, req.user.id),
        eq(tenantUsers.tenantId, tenantId)
      ),
    });
    
    if (!tenantUser) {
      return res.status(403).json({ message: 'Forbidden: User does not have access to this tenant' });
    }
    
    // Attach tenant role to request
    req.user.tenantRole = tenantUser.role;
    
    next();
  } catch (error) {
    console.error('Tenant access error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Role-based access control middleware
 * Ensures user has the required role
 * @param roles Array of allowed roles
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.tenantRole) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    
    if (!roles.includes(req.user.tenantRole)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        tenantId?: string;
        tenantRole?: string;
      };
    }
  }
}
