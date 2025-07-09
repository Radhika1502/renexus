declare namespace Express {
  export interface User {
    id: string;
    role: string;
    email: string;
    tenantId?: string;
    tenantRole?: string;
  }

  export interface Request {
    user?: User;
  }
} 