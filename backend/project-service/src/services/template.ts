import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { 
  projectTemplates, 
  taskTemplates, 
  projects,
  tasks
} from '../schemas/database';
import { 
  createTemplateSchema, 
  listTemplatesQuerySchema, 
  updateTemplateSchema,
  applyTemplateSchema 
} from '../schemas/template';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTemplateData {
  name: string;
  description?: string;
  tenantId: string;
  createdById: string;
  isPublic?: boolean;
  sourceProjectId?: string;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface ListTemplatesOptions {
  tenantId: string;
  isPublic?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  tenantId: string;
  createdById: string;
  teamId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class TemplateService {
  async createFromProject(data: CreateTemplateData) {
    return await db.transaction(async (tx) => {
      const templateId = uuidv4();

      const [template] = await tx.insert(projectTemplates)
        .values({
          id: templateId,
          name: data.name,
          description: data.description || '',
          tenantId: data.tenantId,
          createdById: data.createdById,
          isPublic: data.isPublic || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (data.sourceProjectId) {
        const sourceTasks = await tx.select()
          .from(tasks)
          .where(sql`${tasks.projectId} = ${data.sourceProjectId}`);

        if (sourceTasks.length > 0) {
          const taskTemplateValues = sourceTasks.map(task => ({
            id: uuidv4(),
            projectTemplateId: templateId,
            name: task.name,
            description: task.description || '',
            tenantId: data.tenantId,
            createdById: data.createdById,
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            category: task.category || null,
            isPublic: data.isPublic || false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          await tx.insert(taskTemplates)
            .values(taskTemplateValues);
        }
      }

      return template;
    });
  }

  async getTemplateById(id: string, tenantId: string) {
    return await db.transaction(async (tx) => {
      const [template] = await tx.select()
        .from(projectTemplates)
        .where(sql`${projectTemplates.id} = ${id} AND ${projectTemplates.tenantId} = ${tenantId}`)
        .limit(1);

      if (!template) {
        return null;
      }

      const tasks = await tx.select()
        .from(taskTemplates)
        .where(sql`${taskTemplates.projectTemplateId} = ${id}`);

      return {
        ...template,
        tasks,
      };
    });
  }

  async updateTemplate(id: string, tenantId: string, data: UpdateTemplateData) {
    const [template] = await db.transaction(async (tx) => {
      return await tx.update(projectTemplates)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(sql`${projectTemplates.id} = ${id} AND ${projectTemplates.tenantId} = ${tenantId}`)
        .returning();
    });

    return template || null;
  }

  async deleteTemplate(id: string, tenantId: string) {
    return await db.transaction(async (tx) => {
      await tx.delete(taskTemplates)
        .where(sql`${taskTemplates.projectTemplateId} = ${id}`);

      const [template] = await tx.delete(projectTemplates)
        .where(sql`${projectTemplates.id} = ${id} AND ${projectTemplates.tenantId} = ${tenantId}`)
        .returning();

      return template || null;
    });
  }

  async listTemplates(options: ListTemplatesOptions) {
    return await db.transaction(async (tx) => {
      let conditions = sql`${projectTemplates.tenantId} = ${options.tenantId}`;

      if (options.isPublic !== undefined) {
        conditions = sql`${conditions} AND ${projectTemplates.isPublic} = ${options.isPublic}`;
      }

      if (options.search) {
        conditions = sql`${conditions} AND ${projectTemplates.name} LIKE ${`%${options.search}%`}`;
      }

      const query = tx.select()
        .from(projectTemplates)
        .where(conditions)
        .orderBy(sql`${projectTemplates.createdAt} DESC`);

      const finalQuery = options.limit
        ? query.limit(options.limit).offset(options.offset || 0)
        : query;

      return await finalQuery;
    });
  }

  async applyTemplate(templateId: string, projectData: CreateProjectData) {
    return await db.transaction(async (tx) => {
      const template = await this.getTemplateById(templateId, projectData.tenantId);
      if (!template) {
        throw new Error('Template not found');
      }

      const projectId = uuidv4();
      const [project] = await tx.insert(projects)
        .values({
          id: projectId,
          name: projectData.name,
          description: projectData.description || '',
          status: 'active',
          tenantId: projectData.tenantId,
          createdById: projectData.createdById,
          teamId: projectData.teamId,
          startDate: projectData.startDate,
          endDate: projectData.endDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create tasks from template tasks
      if (template.tasks.length > 0) {
        const taskValues = template.tasks.map(templateTask => ({
          id: uuidv4(),
          projectId: projectId,
          name: templateTask.name,
          description: templateTask.description || '',
          status: templateTask.status || 'todo',
          priority: templateTask.priority || 'medium',
          category: templateTask.category || null,
          tenantId: projectData.tenantId,
          createdById: projectData.createdById,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await tx.insert(tasks)
          .values(taskValues);
      }

      return project;
    });
  }
}

// Export singleton instance
export const templateService = new TemplateService(); 