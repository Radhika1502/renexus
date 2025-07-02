import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { formatResponse } from "../../shared/utils/response";
import sessionService from '../services/auth/session.service';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user data to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(formatResponse('error', 'Unauthorized - No token provided', null));
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
      req.user = decoded;
      
      // Verify session is valid if session token is provided
      const sessionToken = req.headers['session-token'] as string;
      if (sessionToken) {
        const session = await sessionService.validateSession(sessionToken);
        if (!session) {
          return res.status(401).json(formatResponse('error', 'Unauthorized - Invalid session', null));
        }
        req.session = session;
      }
      
      next();
    } catch (error) {
      return res.status(401).json(formatResponse('error', 'Unauthorized - Invalid token', null));
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json(formatResponse('error', 'Internal server error', null));
  }
};

/**
 * Role-based access control middleware
 * Verifies user has required role(s)
 * @param roles Array of allowed roles
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(formatResponse('error', 'Unauthorized - Authentication required', null));
    }

    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json(formatResponse('error', 'Forbidden - Insufficient permissions', null));
    }

    next();
  };
};

/**
 * Permission validation middleware
 * Verifies user has required permission(s)
 * @param permissions Array of required permissions
 */
export const requirePermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(formatResponse('error', 'Unauthorized - Authentication required', null));
    }

    // Get user permissions from JWT token or fetch from database
    const userPermissions = req.user.permissions || [];
    
    // Check if user has all required permissions
    const hasAllPermissions = permissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json(formatResponse('error', 'Forbidden - Insufficient permissions', null));
    }

    next();
  };
};

/**
 * Tenant access middleware
 * Ensures user has access to the requested tenant
 */
export const requireTenantAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json(formatResponse('error', 'Unauthorized - Authentication required', null));
    }

    const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
    
    if (!tenantId) {
      return res.status(400).json(formatResponse('error', 'Bad request - Tenant ID is required', null));
    }

    // Check if user has access to tenant (simplified version)
    // In a real implementation, this would query the database
    const userTenants = req.user.tenants || [];
    if (!userTenants.includes(tenantId)) {
      return res.status(403).json(formatResponse('error', 'Forbidden - No access to this tenant', null));
    }

    next();
  } catch (error) {
    console.error('Tenant access check error:', error);
    return res.status(500).json(formatResponse('error', 'Internal server error', null));
  }
};

// Add types to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
    }
  }
}

