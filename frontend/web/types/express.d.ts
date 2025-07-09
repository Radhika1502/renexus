import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        tenantId: string;
        role: string;
      };
    }
  }
}

// This file is required to augment the Express Request type
// with our custom user property added by authentication middleware
