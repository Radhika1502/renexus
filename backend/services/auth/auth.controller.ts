import { Request, Response } from 'express';
import { authService, registerSchema, loginSchema } from './auth.service';
import { z } from 'zod';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
export class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  async register(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);
      
      // Register user
      const user = await authService.register(validatedData);
      
      return res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Login a user
   * @route POST /api/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      
      // Login user
      const result = await authService.login(validatedData);
      
      // Set session cookie
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
      
      return res.status(200).json({
        message: 'Login successful',
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      if (error instanceof Error) {
        return res.status(401).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Logout a user
   * @route POST /api/auth/logout
   */
  async logout(req: Request, res: Response) {
    try {
      const sessionId = req.cookies.sessionId;
      
      if (!sessionId) {
        return res.status(400).json({
          message: 'No session found',
        });
      }
      
      // Logout user
      await authService.logout(sessionId);
      
      // Clear session cookie
      res.clearCookie('sessionId');
      
      return res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Get current user profile
   * @route GET /api/auth/me
   */
  async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized',
        });
      }
      
      // Get user profile
      const user = await authService.getUserById(req.user.id);
      
      return res.status(200).json({
        user,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Get user's tenants
   * @route GET /api/auth/tenants
   */
  async getUserTenants(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized',
        });
      }
      
      // Get user tenants
      const tenants = await authService.getUserTenants(req.user.id);
      
      return res.status(200).json({
        tenants,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Change user password
   * @route POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Unauthorized',
        });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: 'Current password and new password are required',
        });
      }
      
      // Change password
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      
      return res.status(200).json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
}

// Export singleton instance
export const authController = new AuthController();
