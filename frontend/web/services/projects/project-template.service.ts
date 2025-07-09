import { z } from 'zod';
import { db } from '../../database/db';
import { projectTemplates, projects, projectMembers, tasks } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TaskService } from '../tasks/task.service';

// Schema for project template creation
export const createProjectTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  tenantId: z.string().uuid(),
  createdById: z.string().uuid(),
  defaultTasks: z.array(
    z.object({
      title: z.string().min(3).max(100),
      description: z.string().optional(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      estimatedHours: z.number().optional(),
    })
  ).optional(),
  isPublic: z.boolean().optional().default(false),
});

// Schema for project template update
export const updateProjectTemplateSchema = createProjectTemplateSchema.partial();

// Schema for applying template to project
export const applyTemplateSchema = z.object({
  projectId: z.string().uuid(),
  templateId: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
});

export class ProjectTemplateService {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * Create a new project template
   */
  async createTemplate(data: z.infer<typeof createProjectTemplateSchema>) {
    const templateId = uuidv4();
    
    const template = await db.insert(projectTemplates).values({
      id: templateId,
      name: data.name,
      description: data.description || '',
      tenantId: data.tenantId,
      createdById: data.createdById,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: data.isPublic || false,
    }).returning();
    
    return template[0];
  }

  /**
   * Get a project template by ID
   */
  async getTemplateById(templateId: string, tenantId: string) {
    const template = await db.query.projectTemplates.findFirst({
      where: and(
        eq(projectTemplates.id, templateId),
        eq(projectTemplates.tenantId, tenantId)
      ),
    });
    
    return template;
  }

  /**
   * Update a project template
   */
  async updateTemplate(
    templateId: string, 
    tenantId: string, 
    data: z.infer<typeof updateProjectTemplateSchema>
  ) {
    const template = await db.update(projectTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectTemplates.id, templateId),
          eq(projectTemplates.tenantId, tenantId)
        )
      )
      .returning();
    
    return template[0];
  }

  /**
   * Delete a project template
   */
  async deleteTemplate(templateId: string, tenantId: string) {
    await db.delete(projectTemplates)
      .where(
        and(
          eq(projectTemplates.id, templateId),
          eq(projectTemplates.tenantId, tenantId)
        )
      );
    
    return { success: true };
  }

  /**
   * Get all project templates for a tenant
   */
  async getTemplatesByTenant(
    tenantId: string, 
    page = 1, 
    limit = 10
  ) {
    const offset = (page - 1) * limit;
    
    const templates = await db.query.projectTemplates.findMany({
      where: eq(projectTemplates.tenantId, tenantId),
      limit,
      offset,
      orderBy: [projectTemplates.createdAt],
    });
    
    const totalCount = await db.select({ count: db.fn.count() })
      .from(projectTemplates)
      .where(eq(projectTemplates.tenantId, tenantId));
    
    return {
      data: templates,
      pagination: {
        total: Number(totalCount[0].count),
        page,
        limit,
      },
    };
  }

  /**
   * Apply a template to a project
   * This creates tasks based on the template
   */
  async applyTemplate(data: z.infer<typeof applyTemplateSchema>) {
    // Verify the template exists and belongs to the tenant
    const template = await this.getTemplateById(data.templateId, data.tenantId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Verify the project exists and belongs to the tenant
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, data.projectId),
        eq(projects.tenantId, data.tenantId)
      ),
    });
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Get default tasks for this template
    const defaultTasks = await db.query.projectTemplates.findFirst({
      where: eq(projectTemplates.id, data.templateId),
      with: {
        defaultTasks: true,
      },
    });
    
    // Create tasks from template
    if (defaultTasks?.defaultTasks && defaultTasks.defaultTasks.length > 0) {
      for (const taskTemplate of defaultTasks.defaultTasks) {
        await this.taskService.createTask({
          title: taskTemplate.title,
          description: taskTemplate.description || '',
          status: taskTemplate.status || 'TODO',
          priority: taskTemplate.priority || 'MEDIUM',
          estimatedHours: taskTemplate.estimatedHours,
          projectId: data.projectId,
          tenantId: data.tenantId,
          createdById: data.userId,
        });
      }
    }
    
    return { success: true, tasksCreated: defaultTasks?.defaultTasks?.length || 0 };
  }
}

export const projectTemplateService = new ProjectTemplateService();
