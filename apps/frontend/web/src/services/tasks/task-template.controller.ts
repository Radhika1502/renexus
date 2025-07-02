import express from 'express';
import { taskTemplateService, createTaskTemplateSchema, updateTaskTemplateSchema, applyTaskTemplateSchema } from './task-template.service';

export class TaskTemplateController {
  /**
   * Create a new task template
   */
  async createTemplate(req: any, res: any) {
    try {
      const { tenantId, id: userId } = req.user;
      const data = { ...req.body, tenantId, createdById: userId };
      
      // Validate request data
      const validatedData = createTaskTemplateSchema.parse(data);
      
      const template = await taskTemplateService.createTemplate(validatedData);
      
      return res.status(201).json({
        status: 'success',
        data: template,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid input data',
          errors: error.errors,
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to create task template',
      });
    }
  }

  /**
   * Get a task template by ID
   */
  async getTemplateById(req: any, res: any) {
    try {
      const { tenantId } = req.user;
      const { templateId } = req.params;
      
      const template = await taskTemplateService.getTemplateById(templateId, tenantId);
      
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Task template not found',
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: template,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to get task template',
      });
    }
  }

  /**
   * Update a task template
   */
  async updateTemplate(req: any, res: any) {
    try {
      const { tenantId } = req.user;
      const { templateId } = req.params;
      const data = req.body;
      
      // Validate request data
      const validatedData = updateTaskTemplateSchema.partial().parse(data);
      
      const template = await taskTemplateService.updateTemplate(templateId, tenantId, validatedData);
      
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Task template not found',
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: template,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid input data',
          errors: error.errors,
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to update task template',
      });
    }
  }

  /**
   * Delete a task template
   */
  async deleteTemplate(req: any, res: any) {
    try {
      const { tenantId } = req.user;
      const { templateId } = req.params;
      
      await taskTemplateService.deleteTemplate(templateId, tenantId);
      
      return res.status(200).json({
        status: 'success',
        message: 'Task template deleted successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to delete task template',
      });
    }
  }

  /**
   * Get all task templates for a tenant
   */
  async getTemplatesByTenant(req: any, res: any) {
    try {
      const { tenantId } = req.user;
      const { page = 1, limit = 10, category } = req.query;
      
      const templates = await taskTemplateService.getTemplatesByTenant(
        tenantId,
        Number(page),
        Number(limit),
        category
      );
      
      return res.status(200).json({
        status: 'success',
        data: templates.data,
        pagination: templates.pagination,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to get task templates',
      });
    }
  }

  /**
   * Apply a task template to create a new task
   */
  async applyTemplate(req: any, res: any) {
    try {
      const { tenantId, id: userId } = req.user;
      const { templateId, projectId, assigneeIds, dueDate, customFields } = req.body;
      
      // Validate request data
      const validatedData = applyTaskTemplateSchema.parse({
        templateId,
        projectId,
        tenantId,
        userId,
        assigneeIds,
        dueDate,
        customFields,
      });
      
      const result = await taskTemplateService.applyTemplate(validatedData);
      
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid input data',
          errors: error.errors,
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to apply task template',
      });
    }
  }
}

export const taskTemplateController = new TaskTemplateController();
