import { createClient } from 'redis';
import { logger } from "../../shared/utils/logger";

// Redis client
let redisClient: ReturnType<typeof createClient>;

// Template interface
export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Initialize Redis client
 */
async function initializeRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    await redisClient.connect();
    logger.info('Redis client connected');
  }
}

/**
 * Create a new notification template
 * @param template Template data
 */
export async function createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
  try {
    await initializeRedis();
    
    const now = new Date().toISOString();
    const id = `template:${Date.now()}:${Math.floor(Math.random() * 10000)}`;
    
    const newTemplate: NotificationTemplate = {
      id,
      ...template,
      createdAt: now,
      updatedAt: now
    };
    
    // Store template in Redis
    await redisClient.hSet(`template:${id}`, newTemplate);
    
    // Add to templates index
    await redisClient.sAdd('templates', id);
    
    logger.info('Template created', { templateId: id });
    
    return newTemplate;
  } catch (error) {
    logger.error('Failed to create template', { error });
    throw error;
  }
}

/**
 * Get a template by ID
 * @param id Template ID
 */
export async function getTemplate(id: string): Promise<NotificationTemplate | null> {
  try {
    await initializeRedis();
    
    const template = await redisClient.hGetAll(`template:${id}`);
    
    if (!template || Object.keys(template).length === 0) {
      return null;
    }
    
    // Parse variables array
    if (template.variables) {
      template.variables = JSON.parse(template.variables as string);
    }
    
    return template as unknown as NotificationTemplate;
  } catch (error) {
    logger.error('Failed to get template', { error, templateId: id });
    throw error;
  }
}

/**
 * Update a template
 * @param id Template ID
 * @param updates Template updates
 */
export async function updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
  try {
    await initializeRedis();
    
    // Check if template exists
    const template = await redisClient.hGetAll(`template:${id}`);
    
    if (!template || Object.keys(template).length === 0) {
      return null;
    }
    
    // Update template
    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Store updated template
    await redisClient.hSet(`template:${id}`, updatedTemplate);
    
    logger.info('Template updated', { templateId: id });
    
    return updatedTemplate as unknown as NotificationTemplate;
  } catch (error) {
    logger.error('Failed to update template', { error, templateId: id });
    throw error;
  }
}

/**
 * Delete a template
 * @param id Template ID
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    await initializeRedis();
    
    // Check if template exists
    const template = await redisClient.hGetAll(`template:${id}`);
    
    if (!template || Object.keys(template).length === 0) {
      return false;
    }
    
    // Delete template
    await redisClient.del(`template:${id}`);
    
    // Remove from templates index
    await redisClient.sRem('templates', id);
    
    logger.info('Template deleted', { templateId: id });
    
    return true;
  } catch (error) {
    logger.error('Failed to delete template', { error, templateId: id });
    throw error;
  }
}

/**
 * List all templates
 */
export async function listTemplates(): Promise<NotificationTemplate[]> {
  try {
    await initializeRedis();
    
    // Get all template IDs
    const templateIds = await redisClient.sMembers('templates');
    
    if (!templateIds.length) {
      return [];
    }
    
    // Get template details
    const templates = [];
    
    for (const id of templateIds) {
      const template = await redisClient.hGetAll(`template:${id}`);
      
      if (!template || Object.keys(template).length === 0) {
        continue;
      }
      
      // Parse variables array
      if (template.variables) {
        template.variables = JSON.parse(template.variables as string);
      }
      
      templates.push(template);
    }
    
    return templates as unknown as NotificationTemplate[];
  } catch (error) {
    logger.error('Failed to list templates', { error });
    throw error;
  }
}

