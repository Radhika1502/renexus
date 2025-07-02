import express from 'express';
import { projectTemplateService, createProjectTemplateSchema, updateProjectTemplateSchema, applyTemplateSchema } from './project-template.service';

export class ProjectTemplateController {
  /**
   * Create a new project template
   */
  async createTemplate(req: any, res: any) {
    try {
      const { tenantId, id: userId } = req.user;
      const data = { ...req.body, tenantId, createdById: userId };
      
      // Validate request data
      const validatedData = createProjectTemplateSchema.parse(data);
      
      const template = await projectTemplateService.createTemplate(validatedData);
      
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
        message: error.message || 'Failed to create project template',
      });
    }
  }

  /**
   * Get a project template by ID
   */
  async getTemplateById(req: any, res: any) {
    try {
      const { tenantId } = req.user;
      const { templateId } = req.params;
      
      const template = await projectTemplateService.getTemplateById(templateId, tenantId);
      
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Project template not found',
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: template,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to get project template',
      });
    }
  }

  /**
   * Update a project template
   */
  async updateTemplate(req: any, res: any) {
    try {
      const { tenantId } = req.user;
      const { templateId } = req.params;
      const data = req.body;
      
      // Validate request data
      const validatedData = updateProjectTemplateSchema.partial().parse(data);
      
      const template = await projectTemplateService.updateTemplate(templateId, tenantId, validatedData);
      
      if (!template) {
        return res.status(404).json({
          status: 'error',
          message: 'Project template not found',
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
        message: error.message || 'Failed to update project template',
      });
    }
  }

  /**
   * Delete a project template
   */
  async deleteTemplate(req: any, res: any) {
    try {
      const { tenantId } = req.user;
      const { templateId } = req.params;
      
      await projectTemplateService.deleteTemplate(templateId, tenantId);
      
      return res.status(200).json({
        status: 'success',
        message: 'Project template deleted successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to delete project template',
      });
    }
  }

  /**
   * Get all project templates for a tenant
   */
  async getTemplatesByTenant(req: any, res: any) {
    try {
      const { tenantId } = req.user;
      const { page = 1, limit = 10 } = req.query;
      
      const templates = await projectTemplateService.getTemplatesByTenant(
        tenantId,
        Number(page),
        Number(limit)
      );
      
      return res.status(200).json({
        status: 'success',
        data: templates.data,
        pagination: templates.pagination,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to get project templates',
      });
    }
  }

  /**
   * Apply a template to a project
   */
  async applyTemplate(req: any, res: any) {
    try {
      const { tenantId, id: userId } = req.user;
      const { projectId, templateId } = req.body;
      
      // Validate request data
      const validatedData = applyTemplateSchema.parse({
        projectId,
        templateId,
        tenantId,
        userId,
      });
      
      const result = await projectTemplateService.applyTemplate(validatedData);
      
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
        message: error.message || 'Failed to apply project template',
      });
    }
  }
}

export const projectTemplateController = new ProjectTemplateController();
