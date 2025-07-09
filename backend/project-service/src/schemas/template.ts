import { z } from 'zod';

// Base template schema
const templateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  status: z.enum(['template', 'active', 'completed', 'on_hold', 'cancelled']).default('template'),
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

// Create template schema
export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    tenantId: z.string().uuid(),
    createdById: z.string().uuid()
  })
});

// Update template schema
export const updateTemplateSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional()
  })
});

// Template params schema
export const templateParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

// List templates query schema
export const listTemplatesQuerySchema = z.object({
  query: z.object({
    status: z.enum(['template', 'active', 'completed', 'on_hold', 'cancelled']).optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  })
});

// Apply template schema
export const applyTemplateSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    tenantId: z.string().uuid(),
    createdById: z.string().uuid(),
    teamId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  })
}); 