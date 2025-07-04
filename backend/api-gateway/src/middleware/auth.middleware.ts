import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    // Skip auth for health checks and public endpoints
    const publicPaths = [
      '/health',
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/docs',
      '/docs'
    ];

    const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
    if (isPublicPath) {
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No valid authorization token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      // Add user information to request object
      (req as any).user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || []
      };

      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    roles: string[];
  };
} 