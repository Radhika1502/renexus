import { Request, Response, NextFunction } from 'express';
import { AuthorizationService } from '../services/security/AuthorizationService';

// Extend Express Request type
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

const authzService = new AuthorizationService();

/**
 * Middleware to check if user has required permission
 */
export const hasPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const hasPermission = await authzService.hasPermission(
        req.user.id,
        resource,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

/**
 * Middleware to check if user has access to tenant
 */
export const hasTenantAccess = (allowedRoles?: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tenantId = req.params.tenantId || req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID is required' });
      }

      const hasTenantAccess = await authzService.hasTenantAccess(req.user.id, tenantId);
      if (!hasTenantAccess) {
        return res.status(403).json({ message: 'Forbidden - No access to tenant' });
      }

      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = await authzService.getTenantRole(req.user.id, tenantId);
        if (!userRole || !allowedRoles.includes(userRole)) {
          return res.status(403).json({ message: 'Forbidden - Insufficient tenant role' });
        }
      }

      next();
    } catch (error) {
      console.error('Tenant access check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

/**
 * Middleware to check if user has tenant role
 */
export const hasTenantRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.tenantRole) {
        return res.status(401).json({ message: 'Unauthorized - No tenant role assigned' });
      }

      if (!allowedRoles.includes(req.user.tenantRole)) {
        return res.status(403).json({ message: 'Forbidden - Insufficient tenant role' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}; 