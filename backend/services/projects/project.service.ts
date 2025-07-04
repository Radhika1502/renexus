import { db } from '../../database/db';
import { projects } from '../../database/schema';
import { eq, and } from 'drizzle-orm';

export const projectService = {
  // Get all projects for a tenant
  async getProjectsByTenant(tenantId: string) {
    return db.query.projects.findMany({
      where: eq(projects.tenantId, tenantId),
      orderBy: projects.name
    });
  },

  // Get a project by ID for a specific tenant
  async getProjectById(projectId: string, tenantId: string) {
    return db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.tenantId, tenantId)
      )
    });
  },

  // Create a new project
  async createProject(data: any) {
    const [project] = await db.insert(projects).values({
      name: data.name,
      description: data.description,
      status: data.status || 'active',
      startDate: data.startDate,
      dueDate: data.dueDate,
      tenantId: data.tenantId,
      createdBy: data.createdBy
    }).returning();
    
    return project;
  },

  // Update a project
  async updateProject(projectId: string, data: any, tenantId: string) {
    const [updatedProject] = await db.update(projects)
      .set({
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        dueDate: data.dueDate,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.tenantId, tenantId)
        )
      )
      .returning();
    
    return updatedProject;
  },

  // Delete a project
  async deleteProject(projectId: string, tenantId: string) {
    const [deletedProject] = await db.delete(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.tenantId, tenantId)
        )
      )
      .returning();
    
    return deletedProject;
  }
};
