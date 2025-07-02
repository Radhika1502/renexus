import { db } from '../../database/db';
import { projects, projectMembers, users, teams } from '../../database/schema/unified_schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Project creation schema validation
 */
export const createProjectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'on_hold', 'cancelled']).default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  tenantId: z.string().uuid(),
  createdBy: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Project update schema validation
 */
export const updateProjectSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'on_hold', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  teamId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Project member schema validation
 */
export const projectMemberSchema = z.object({
  role: z.enum(['viewer', 'contributor', 'manager', 'owner']),
});

/**
 * Project Service
 * Handles project management operations
 */
class ProjectService {
  /**
   * Create a new project
   * @param data Project data
   * @returns Created project
   */
  async createProject(data: z.infer<typeof createProjectSchema>) {
    const projectId = uuidv4();
    
    // Create project
    const [project] = await db.insert(projects).values({
      id: projectId,
      name: data.name,
      description: data.description || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status,
      priority: data.priority,
      tenantId: data.tenantId,
      teamId: data.teamId || null,
      createdBy: data.createdBy,
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Add creator as project owner
    await db.insert(projectMembers).values({
      id: uuidv4(),
      projectId: projectId,
      userId: data.createdBy,
      role: 'owner',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return project;
  }
  
  /**
   * Get project by ID
   * @param projectId Project ID
   * @param tenantId Tenant ID
   * @returns Project or null if not found
   */
  async getProjectById(projectId: string, tenantId: string) {
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.tenantId, tenantId)
      ),
    });
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    return project;
  }
  
  /**
   * Update project
   * @param projectId Project ID
   * @param data Project data to update
   * @param tenantId Tenant ID
   * @returns Updated project
   */
  async updateProject(projectId: string, data: z.infer<typeof updateProjectSchema>, tenantId: string) {
    const project = await this.getProjectById(projectId, tenantId);
    
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };
    
    // Convert date strings to Date objects
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }
    
    const [updatedProject] = await db.update(projects)
      .set(updateData)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.tenantId, tenantId)
      ))
      .returning();
    
    return updatedProject;
  }
  
  /**
   * Delete project
   * @param projectId Project ID
   * @param tenantId Tenant ID
   */
  async deleteProject(projectId: string, tenantId: string) {
    const project = await this.getProjectById(projectId, tenantId);
    
    // Delete project members first (cascade not handled by ORM)
    await db.delete(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
    
    // Delete project
    await db.delete(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.tenantId, tenantId)
      ));
  }
  
  /**
   * Get projects by tenant
   * @param tenantId Tenant ID
   * @param page Page number
   * @param limit Items per page
   * @returns Projects and total count
   */
  async getProjectsByTenant(tenantId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    
    const projectsResult = await db.query.projects.findMany({
      where: eq(projects.tenantId, tenantId),
      limit,
      offset,
      orderBy: projects.createdAt,
    });
    
    const totalCount = await db.select({ count: projects.id })
      .from(projects)
      .where(eq(projects.tenantId, tenantId))
      .then(result => result.length);
    
    return {
      projects: projectsResult,
      total: totalCount,
    };
  }
  
  /**
   * Add member to project
   * @param projectId Project ID
   * @param userId User ID
   * @param role Member role
   * @param tenantId Tenant ID
   * @returns Project member
   */
  async addProjectMember(projectId: string, userId: string, role: string, tenantId: string) {
    // Verify project exists and belongs to tenant
    await this.getProjectById(projectId, tenantId);
    
    // Verify user exists and belongs to tenant
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is already a member
    const existingMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ),
    });
    
    if (existingMember) {
      throw new Error('User is already a member of this project');
    }
    
    // Add user to project
    const [projectMember] = await db.insert(projectMembers).values({
      id: uuidv4(),
      projectId,
      userId,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return projectMember;
  }
  
  /**
   * Remove member from project
   * @param projectId Project ID
   * @param userId User ID
   * @param tenantId Tenant ID
   */
  async removeProjectMember(projectId: string, userId: string, tenantId: string) {
    // Verify project exists and belongs to tenant
    await this.getProjectById(projectId, tenantId);
    
    // Remove user from project
    const result = await db.delete(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ));
    
    if (result.rowCount === 0) {
      throw new Error('User is not a member of this project');
    }
  }
  
  /**
   * Update project member role
   * @param projectId Project ID
   * @param userId User ID
   * @param role New role
   * @param tenantId Tenant ID
   * @returns Updated project member
   */
  async updateProjectMemberRole(projectId: string, userId: string, role: string, tenantId: string) {
    // Verify project exists and belongs to tenant
    await this.getProjectById(projectId, tenantId);
    
    // Update user role
    const [updatedMember] = await db.update(projectMembers)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ))
      .returning();
    
    if (!updatedMember) {
      throw new Error('User is not a member of this project');
    }
    
    return updatedMember;
  }
  
  /**
   * Get project members
   * @param projectId Project ID
   * @param tenantId Tenant ID
   * @returns Project members with user details
   */
  async getProjectMembers(projectId: string, tenantId: string) {
    // Verify project exists and belongs to tenant
    await this.getProjectById(projectId, tenantId);
    
    // Get project members with user details
    const members = await db
      .select({
        id: projectMembers.id,
        projectId: projectMembers.projectId,
        userId: projectMembers.userId,
        role: projectMembers.role,
        createdAt: projectMembers.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));
    
    return members;
  }
  
  /**
   * Get projects by user
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Projects the user is a member of
   */
  async getProjectsByUser(userId: string, tenantId: string) {
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        priority: projects.priority,
        tenantId: projects.tenantId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        role: projectMembers.role,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(and(
        eq(projectMembers.userId, userId),
        eq(projects.tenantId, tenantId)
      ));
    
    return userProjects;
  }
  
  /**
   * Get projects by team
   * @param teamId Team ID
   * @param tenantId Tenant ID
   * @returns Projects associated with the team
   */
  async getProjectsByTeam(teamId: string, tenantId: string) {
    // Verify team exists and belongs to tenant
    const team = await db.query.teams.findFirst({
      where: and(
        eq(teams.id, teamId),
        eq(teams.tenantId, tenantId)
      ),
    });
    
    if (!team) {
      throw new Error('Team not found');
    }
    
    // Get projects by team
    const teamProjects = await db.query.projects.findMany({
      where: and(
        eq(projects.teamId, teamId),
        eq(projects.tenantId, tenantId)
      ),
    });
    
    return teamProjects;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
