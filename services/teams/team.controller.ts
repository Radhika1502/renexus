import { Request, Response } from 'express';
import { teamService, createTeamSchema, updateTeamSchema, teamMemberSchema } from './team.service';
import { z } from 'zod';

/**
 * Team Controller
 * Handles HTTP requests for team management endpoints
 */
export class TeamController {
  /**
   * Create a new team
   * @route POST /api/teams
   */
  async createTeam(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      // Validate request body
      const validatedData = createTeamSchema.parse({
        ...req.body,
        tenantId: req.user.tenantId,
        createdBy: req.user.id,
      });
      
      // Create team
      const team = await teamService.createTeam(validatedData);
      
      return res.status(201).json({
        message: 'Team created successfully',
        team,
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
   * Get team by ID
   * @route GET /api/teams/:teamId
   */
  async getTeamById(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const teamId = req.params.teamId;
      
      // Get team
      const team = await teamService.getTeamById(teamId, req.user.tenantId);
      
      return res.status(200).json({
        team,
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
   * Update team
   * @route PUT /api/teams/:teamId
   */
  async updateTeam(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const teamId = req.params.teamId;
      
      // Validate request body
      const validatedData = updateTeamSchema.parse(req.body);
      
      // Update team
      const team = await teamService.updateTeam(teamId, validatedData, req.user.tenantId);
      
      return res.status(200).json({
        message: 'Team updated successfully',
        team,
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
   * Delete team
   * @route DELETE /api/teams/:teamId
   */
  async deleteTeam(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const teamId = req.params.teamId;
      
      // Delete team
      await teamService.deleteTeam(teamId, req.user.tenantId);
      
      return res.status(200).json({
        message: 'Team deleted successfully',
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
   * Get teams by tenant
   * @route GET /api/teams
   */
  async getTeamsByTenant(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Get teams by tenant
      const result = await teamService.getTeamsByTenant(req.user.tenantId, page, limit);
      
      return res.status(200).json({
        teams: result.teams,
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
   * Add member to team
   * @route POST /api/teams/:teamId/members
   */
  async addTeamMember(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const teamId = req.params.teamId;
      const { userId, role } = req.body;
      
      // Validate role
      const validatedData = teamMemberSchema.parse({ role });
      
      // Add member to team
      const teamMember = await teamService.addTeamMember(
        teamId, 
        userId, 
        validatedData.role, 
        req.user.tenantId
      );
      
      return res.status(201).json({
        message: 'Team member added successfully',
        teamMember,
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
   * Remove member from team
   * @route DELETE /api/teams/:teamId/members/:userId
   */
  async removeTeamMember(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const teamId = req.params.teamId;
      const userId = req.params.userId;
      
      // Remove member from team
      await teamService.removeTeamMember(teamId, userId, req.user.tenantId);
      
      return res.status(200).json({
        message: 'Team member removed successfully',
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
   * Update team member role
   * @route PUT /api/teams/:teamId/members/:userId
   */
  async updateTeamMemberRole(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const teamId = req.params.teamId;
      const userId = req.params.userId;
      const { role } = req.body;
      
      // Validate role
      const validatedData = teamMemberSchema.parse({ role });
      
      // Update member role
      const teamMember = await teamService.updateTeamMemberRole(
        teamId, 
        userId, 
        validatedData.role, 
        req.user.tenantId
      );
      
      return res.status(200).json({
        message: 'Team member role updated successfully',
        teamMember,
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
   * Get team members
   * @route GET /api/teams/:teamId/members
   */
  async getTeamMembers(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const teamId = req.params.teamId;
      
      // Get team members
      const members = await teamService.getTeamMembers(teamId, req.user.tenantId);
      
      return res.status(200).json({
        members,
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
}

// Export singleton instance
export const teamController = new TeamController();
