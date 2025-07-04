import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TasksService } from './tasks.service';

@Injectable()
export class TaskTemplatesService {
  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
  ) {}

  async findAll(projectId?: string) {
    const filter = projectId ? { where: { projectId } } : undefined;
    return this.prisma.taskTemplate.findMany(filter);
  }

  async findOne(id: string) {
    const template = await this.prisma.taskTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async create(data: {
    name: string;
    description?: string;
    projectId?: string;
    priority?: string;
    estimatedHours?: number;
    category?: string;
    fields: Record<string, boolean>;
  }) {
    return this.prisma.taskTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        projectId: data.projectId,
        priority: data.priority || 'medium',
        estimatedHours: data.estimatedHours,
        category: data.category,
        fields: JSON.stringify(data.fields),
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    projectId?: string;
    priority?: string;
    estimatedHours?: number;
    category?: string;
    fields?: Record<string, boolean>;
  }) {
    try {
      const updateData: any = { ...data };
      if (data.fields) {
        updateData.fields = JSON.stringify(data.fields);
      }
      
      return await this.prisma.taskTemplate.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Template with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.taskTemplate.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Template with ID ${id} not found`);
      }
      throw error;
    }
  }

  async createTaskFromTemplate(templateId: string, projectId?: string, customFields?: any) {
    // Get the template
    const template = await this.findOne(templateId);
    
    // Parse the fields configuration
    const fields = JSON.parse(template.fields) as Record<string, boolean>;
    
    // Create the task data
    const taskData: any = {
      title: customFields?.title || template.name,
      description: customFields?.description || template.description,
      priority: template.priority,
      estimatedHours: template.estimatedHours,
      projectId: projectId || template.projectId,
      status: 'todo', // Default status for new tasks
      createdFromTemplate: true,
    };
    
    // Add any additional custom fields based on the template fields configuration
    if (fields.dueDate && customFields?.dueDate) {
      taskData.dueDate = new Date(customFields.dueDate);
    }
    
    if (fields.assignee && customFields?.assigneeId) {
      taskData.assigneeId = customFields.assigneeId;
    }
    
    // Create the task
    return this.tasksService.create(taskData);
  }
}
