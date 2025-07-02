import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get all users (admin only)
   */
  public getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const users = await this.userService.findAll();
      
      res.json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user by ID
   */
  public getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = req.user as { id: string; role: string };
      
      // Only allow users to access their own data unless they're an admin
      if (id !== currentUser.id && currentUser.role !== 'ADMIN') {
        const error = {
          status: 403,
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        };
        return next(error);
      }
      
      const user = await this.userService.findById(id);
      
      if (!user) {
        const error = {
          status: 404,
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        };
        return next(error);
      }
      
      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user
   */
  public updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = req.user as { id: string; role: string };
      
      // Only allow users to update their own data unless they're an admin
      if (id !== currentUser.id && currentUser.role !== 'ADMIN') {
        const error = {
          status: 403,
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        };
        return next(error);
      }
      
      const { name, email } = req.body;
      
      // Check if user exists
      const existingUser = await this.userService.findById(id);
      if (!existingUser) {
        const error = {
          status: 404,
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        };
        return next(error);
      }
      
      // Check if email is already taken
      if (email && email !== existingUser.email) {
        const emailExists = await this.userService.findByEmail(email);
        if (emailExists) {
          const error = {
            status: 400,
            code: 'EMAIL_EXISTS',
            message: 'Email is already in use',
          };
          return next(error);
        }
      }
      
      // Update user
      const updatedUser = await this.userService.update(id, { name, email });
      
      res.json({
        success: true,
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user password
   */
  public updatePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = req.user as { id: string; role: string };
      
      // Only allow users to update their own password
      if (id !== currentUser.id) {
        const error = {
          status: 403,
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        };
        return next(error);
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // Verify current password
      const isPasswordValid = await this.userService.verifyPassword(id, currentPassword);
      if (!isPasswordValid) {
        const error = {
          status: 400,
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect',
        };
        return next(error);
      }
      
      // Update password
      await this.userService.updatePassword(id, newPassword);
      
      res.json({
        success: true,
        data: { message: 'Password updated successfully' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user preferences
   */
  public updatePreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUser = req.user as { id: string; role: string };
      
      // Only allow users to update their own preferences
      if (id !== currentUser.id) {
        const error = {
          status: 403,
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        };
        return next(error);
      }
      
      const { preferences } = req.body;
      
      // Update preferences
      const updatedUser = await this.userService.updatePreferences(id, preferences);
      
      res.json({
        success: true,
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete user (admin only)
   */
  public deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const existingUser = await this.userService.findById(id);
      if (!existingUser) {
        const error = {
          status: 404,
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        };
        return next(error);
      }
      
      // Delete user
      await this.userService.delete(id);
      
      res.json({
        success: true,
        data: { message: 'User deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  };
}
