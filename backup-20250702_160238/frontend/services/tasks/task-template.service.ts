import { z } from 'zod';
import { db } from '../../database/db';
import { taskTemplates } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TaskService } from './task.service';

// Schema for task template creation
export const createTaskTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  tenantId: z.string().uuid(),
  createdById: z.string().uuid(),
  title: z.string().min(3).max(100),
  taskDescription: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedHours: z.number().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
});

// Schema for task template update
export const updateTaskTemplateSchema = createTaskTemplateSchema.partial();

// Schema for applying template to create a task
export const applyTaskTemplateSchema = z.object({
  templateId: z.string().uuid(),
  projectId: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  dueDate: z.string().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

export class TaskTemplateService {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * Create a new task template
   */
  async createTemplate(data: z.infer<typeof createTaskTemplateSchema>) {
    const templateId = uuidv4();
    
    const template = await db.insert(taskTemplates).values({
      id: templateId,
      name: data.name,
      description: data.description || '',
      tenantId: data.tenantId,
      createdById: data.createdById,
      title: data.title,
      taskDescription: data.taskDescription || '',
      status: data.status || 'TODO',
      priority: data.priority || 'MEDIUM',
      estimatedHours: data.estimatedHours,
      category: data.category || 'General',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: data.isPublic || false,
    }).returning();
    
    return template[0];
  }

  /**
   * Get a task template by ID
   */
  async getTemplateById(templateId: string, tenantId: string) {
    const template = await db.query.taskTemplates.findFirst({
      where: and(
        eq(taskTemplates.id, templateId),
        eq(taskTemplates.tenantId, tenantId)
      ),
    });
    
    return template;
  }

  /**
   * Update a task template
   */
  async updateTemplate(
    templateId: string, 
    tenantId: string, 
    data: z.infer<typeof updateTaskTemplateSchema>
  ) {
    const template = await db.update(taskTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(taskTemplates.id, templateId),
          eq(taskTemplates.tenantId, tenantId)
        )
      )
      .returning();
    
    return template[0];
  }

  /**
   * Delete a task template
   */
  async deleteTemplate(templateId: string, tenantId: string) {
    await db.delete(taskTemplates)
      .where(
        and(
          eq(taskTemplates.id, templateId),
          eq(taskTemplates.tenantId, tenantId)
        )
      );
    
    return { success: true };
  }

  /**
   * Get all task templates for a tenant
   */
  async getTemplatesByTenant(
    tenantId: string, 
    page = 1, 
    limit = 10,
    category?: string
  ) {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(taskTemplates)
      .where(eq(taskTemplates.tenantId, tenantId));
    
    if (category) {
      query = query.where(eq(taskTemplates.category, category));
    }
    
    const templates = await query
      .limit(limit)
      .offset(offset)
      .orderBy(taskTemplates.createdAt);
    
    const totalCountQuery = db.select({ count: db.fn.count() })
      .from(taskTemplates)
      .where(eq(taskTemplates.tenantId, tenantId));
    
    if (category) {
      totalCountQuery.where(eq(taskTemplates.category, category));
    }
    
    const totalCount = await totalCountQuery;
    
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
   * Apply a task template to create a new task
   */
  async applyTemplate(data: z.infer<typeof applyTaskTemplateSchema>) {
    // Verify the template exists and belongs to the tenant
    const template = await this.getTemplateById(data.templateId, data.tenantId);
    if (!template) {
      throw new Error('Task template not found');
    }
    
    // Create task from template
    const task = await this.taskService.createTask({
      title: template.title,
      description: template.taskDescription || '',
      status: template.status || 'TODO',
      priority: template.priority || 'MEDIUM',
      estimatedHours: template.estimatedHours,
      projectId: data.projectId,
      tenantId: data.tenantId,
      createdById: data.userId,
      dueDate: data.dueDate,
      category: template.category,
      customFields: data.customFields,
    });
    
    // Assign users if provided
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      for (const assigneeId of data.assigneeIds) {
        await this.taskService.assignTask({
          taskId: task.id,
          userId: assigneeId,
          tenantId: data.tenantId,
        });
      }
    }
    
    return { success: true, task };
  }
}

export const taskTemplateService = new TaskTemplateService();
