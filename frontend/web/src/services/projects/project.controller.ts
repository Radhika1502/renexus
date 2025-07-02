import { Request, Response } from 'express';
import { projectService, createProjectSchema, updateProjectSchema, projectMemberSchema } from './project.service';
import { z } from 'zod';

/**
 * Project Controller
 * Handles HTTP requests for project management endpoints
 */
export class ProjectController {
  /**
   * Create a new project
   * @route POST /api/projects
   */
  async createProject(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      // Validate request body
      const validatedData = createProjectSchema.parse({
        ...req.body,
        tenantId: req.user.tenantId,
        createdBy: req.user.id,
      });
      
      // Create project
      const project = await projectService.createProject(validatedData);
      
      return res.status(201).json({
        message: 'Project created successfully',
        project,
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
   * Get project by ID
   * @route GET /api/projects/:projectId
   */
  async getProjectById(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const projectId = req.params.projectId;
      
      // Get project
      const project = await projectService.getProjectById(projectId, req.user.tenantId);
      
      return res.status(200).json({
        project,
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
   * Update project
   * @route PUT /api/projects/:projectId
   */
  async updateProject(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const projectId = req.params.projectId;
      
      // Validate request body
      const validatedData = updateProjectSchema.parse(req.body);
      
      // Update project
      const project = await projectService.updateProject(projectId, validatedData, req.user.tenantId);
      
      return res.status(200).json({
        message: 'Project updated successfully',
        project,
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
   * Delete project
   * @route DELETE /api/projects/:projectId
   */
  async deleteProject(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const projectId = req.params.projectId;
      
      // Delete project
      await projectService.deleteProject(projectId, req.user.tenantId);
      
      return res.status(200).json({
        message: 'Project deleted successfully',
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
   * Get projects by tenant
   * @route GET /api/projects
   */
  async getProjectsByTenant(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Get projects by tenant
      const result = await projectService.getProjectsByTenant(req.user.tenantId, page, limit);
      
      return res.status(200).json({
        projects: result.projects,
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
   * Get projects by team
   * @route GET /api/teams/:teamId/projects
   */
  async getProjectsByTeam(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const teamId = req.params.teamId;
      
      // Get projects by team
      const projects = await projectService.getProjectsByTeam(teamId, req.user.tenantId);
      
      return res.status(200).json({
        projects,
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
   * Get projects by user
   * @route GET /api/users/:userId/projects
   */
  async getProjectsByUser(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const userId = req.params.userId;
      
      // Get projects by user
      const projects = await projectService.getProjectsByUser(userId, req.user.tenantId);
      
      return res.status(200).json({
        projects,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Add member to project
   * @route POST /api/projects/:projectId/members
   */
  async addProjectMember(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const projectId = req.params.projectId;
      const { userId, role } = req.body;
      
      // Validate role
      const validatedData = projectMemberSchema.parse({ role });
      
      // Add member to project
      const projectMember = await projectService.addProjectMember(
        projectId, 
        userId, 
        validatedData.role, 
        req.user.tenantId
      );
      
      return res.status(201).json({
        message: 'Project member added successfully',
        projectMember,
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
   * Remove member from project
   * @route DELETE /api/projects/:projectId/members/:userId
   */
  async removeProjectMember(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const projectId = req.params.projectId;
      const userId = req.params.userId;
      
      // Remove member from project
      await projectService.removeProjectMember(projectId, userId, req.user.tenantId);
      
      return res.status(200).json({
        message: 'Project member removed successfully',
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
   * Update project member role
   * @route PUT /api/projects/:projectId/members/:userId
   */
  async updateProjectMemberRole(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const projectId = req.params.projectId;
      const userId = req.params.userId;
      const { role } = req.body;
      
      // Validate role
      const validatedData = projectMemberSchema.parse({ role });
      
      // Update member role
      const projectMember = await projectService.updateProjectMemberRole(
        projectId, 
        userId, 
        validatedData.role, 
        req.user.tenantId
      );
      
      return res.status(200).json({
        message: 'Project member role updated successfully',
        projectMember,
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
   * Get project members
   * @route GET /api/projects/:projectId/members
   */
  async getProjectMembers(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const projectId = req.params.projectId;
      
      // Get project members
      const members = await projectService.getProjectMembers(projectId, req.user.tenantId);
      
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
export const projectController = new ProjectController();
