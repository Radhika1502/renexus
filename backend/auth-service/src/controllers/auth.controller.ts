import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { logger } from "../utils/logger";
import { db } from '../config/database';
import { users } from '../models/schema';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  /**
   * Register a new user
   */
  public register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password, name, organizationName } = req.body;
      
      // Check if user already exists
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        const error = {
          status: 400,
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
        };
        return next(error);
      }
      
      // Create user
      const user = await this.authService.register({
        email,
        password,
        name,
        organizationName,
      });
      
      // Generate tokens
      const { token, refreshToken, expiresAt } = this.authService.generateTokens(user);
      
      res.status(201).json({
        success: true,
        data: {
          user,
          token,
          refreshToken,
          expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   */
  public login = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        const error = {
          status: 401,
          code: 'INVALID_CREDENTIALS',
          message: info?.message || 'Invalid email or password',
        };
        return next(error);
      }
      
      try {
        // Generate tokens
        const { token, refreshToken, expiresAt } = this.authService.generateTokens(user);
        
        // Store refresh token
        this.authService.storeRefreshToken(user.id, refreshToken);
        
        res.json({
          success: true,
          data: {
            user,
            token,
            refreshToken,
            expiresAt,
          },
        });
      } catch (error) {
        next(error);
      }
    })(req, res, next);
  };

  /**
   * Refresh access token
   */
  public refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      // Verify refresh token
      const result = await this.authService.verifyRefreshToken(refreshToken);
      
      if (!result.valid || !result.userId) {
        const error = {
          status: 401,
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        };
        return next(error);
      }
      
      // Get user
      const user = await this.userService.findById(result.userId);
      if (!user) {
        const error = {
          status: 404,
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        };
        return next(error);
      }
      
      // Generate new tokens
      const { token, refreshToken: newRefreshToken, expiresAt } = this.authService.generateTokens(user);
      
      // Update refresh token
      await this.authService.rotateRefreshToken(result.userId, refreshToken, newRefreshToken);
      
      res.json({
        success: true,
        data: {
          token,
          refreshToken: newRefreshToken,
          expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   */
  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user as { id: string };
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await this.authService.revokeRefreshToken(user.id, refreshToken);
      }
      
      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user
   */
  public getCurrentUser = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      res.json({
        success: true,
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send password reset email
   */
  public forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;
      
      // Check if user exists
      const user = await this.userService.findByEmail(email);
      
      if (user) {
        // Generate reset token
        const resetToken = await this.authService.generatePasswordResetToken(user.id);
        
        // In a real application, send email with reset link
        logger.info(`Password reset token for ${email}: ${resetToken}`);
      }
      
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        data: { message: 'If the email exists, a password reset link has been sent' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset password with token
   */
  public resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token, password } = req.body;
      
      // Verify reset token
      const result = await this.authService.verifyPasswordResetToken(token);
      
      if (!result.valid || !result.userId) {
        const error = {
          status: 400,
          code: 'INVALID_RESET_TOKEN',
          message: 'Invalid or expired reset token',
        };
        return next(error);
      }
      
      // Update password
      await this.userService.updatePassword(result.userId, password);
      
      // Revoke token
      await this.authService.revokePasswordResetToken(token);
      
      res.json({
        success: true,
        data: { message: 'Password reset successfully' },
      });
    } catch (error) {
      next(error);
    }
  };
}

