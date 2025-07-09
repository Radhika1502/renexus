import { z } from 'zod';

// Base project schema
const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).default('active'),
  tenantId: z.string().uuid(),
  createdById: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  members: z.array(z.string().uuid()).default([]),
  templateId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Create project schema
export const createProjectSchema = z.object({
  body: projectSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true,
    members: true 
  })
});

// Update project schema
export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: projectSchema.omit({ 
    id: true, 
    tenantId: true, 
    createdById: true, 
    createdAt: true, 
    updatedAt: true,
    members: true 
  }).partial()
});

// Project params schema
export const projectParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

// Add member schema
export const addMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    userId: z.string().uuid()
  })
});

// List projects query schema
export const listProjectsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  })
});

// Project response schema
export const projectResponseSchema = projectSchema;

// Export all schemas for Fastify
export const projectSchemas = [
  {
    $id: 'createProjectSchema',
    schema: createProjectSchema,
  },
  {
    $id: 'updateProjectSchema',
    schema: updateProjectSchema,
  },
  {
    $id: 'projectParamsSchema',
    schema: projectParamsSchema,
  },
  {
    $id: 'listProjectsQuerySchema',
    schema: listProjectsQuerySchema,
  },
  {
    $id: 'projectResponseSchema',
    schema: projectResponseSchema,
  },
]; 