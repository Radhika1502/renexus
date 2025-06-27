import { Request, Response } from 'express';
import { userService, createUserSchema, updateUserSchema } from './user.service';
import { z } from 'zod';

/**
 * User Controller
 * Handles HTTP requests for user management endpoints
 */
export class UserController {
  /**
   * Create a new user
   * @route POST /api/users
   */
  async createUser(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      // Validate request body
      const validatedData = createUserSchema.parse({
        ...req.body,
        tenantId: req.user.tenantId,
      });
      
      // Create user
      const user = await userService.createUser(validatedData);
      
      return res.status(201).json({
        message: 'User created successfully',
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
   * Get user by ID
   * @route GET /api/users/:userId
   */
  async getUserById(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const userId = req.params.userId;
      
      // Get user
      const user = await userService.getUserById(userId, req.user.tenantId);
      
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
   * Update user
   * @route PUT /api/users/:userId
   */
  async updateUser(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const userId = req.params.userId;
      
      // Validate request body
      const validatedData = updateUserSchema.parse(req.body);
      
      // Update user
      const user = await userService.updateUser(userId, validatedData, req.user.tenantId);
      
      return res.status(200).json({
        message: 'User updated successfully',
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
   * Delete user from tenant
   * @route DELETE /api/users/:userId
   */
  async deleteUser(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const userId = req.params.userId;
      
      // Delete user from tenant
      await userService.deleteUserFromTenant(userId, req.user.tenantId);
      
      return res.status(200).json({
        message: 'User removed from tenant successfully',
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
   * Get users by tenant
   * @route GET /api/users
   */
  async getUsersByTenant(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Get users by tenant
      const result = await userService.getUsersByTenant(req.user.tenantId, page, limit);
      
      return res.status(200).json({
        users: result.users,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Add user to team
   * @route POST /api/users/:userId/teams/:teamId
   */
  async addUserToTeam(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const teamId = req.params.teamId;
      const { role } = req.body;
      
      // Add user to team
      const teamMember = await userService.addUserToTeam(userId, teamId, role);
      
      return res.status(200).json({
        message: 'User added to team successfully',
        teamMember,
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
  
  /**
   * Remove user from team
   * @route DELETE /api/users/:userId/teams/:teamId
   */
  async removeUserFromTeam(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const teamId = req.params.teamId;
      
      // Remove user from team
      await userService.removeUserFromTeam(userId, teamId);
      
      return res.status(200).json({
        message: 'User removed from team successfully',
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
  
  /**
   * Get user's teams
   * @route GET /api/users/:userId/teams
   */
  async getUserTeams(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const userId = req.params.userId;
      
      // Get user teams
      const teams = await userService.getUserTeams(userId, req.user.tenantId);
      
      return res.status(200).json({
        teams,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
}

// Export singleton instance
export const userController = new UserController();
