import { z } from 'zod';

// Base member schema
const memberSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Add member schema
export const addMemberSchema = memberSchema
  .omit({ id: true, createdAt: true, updatedAt: true });

// Update member schema
export const updateMemberSchema = memberSchema
  .pick({ role: true });

// Member params schema
export const memberParamsSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
});

// List members query schema
export const listMembersQuerySchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Member response schema
export const memberResponseSchema = memberSchema;

// Export all schemas for Fastify
export const memberSchemas = [
  {
    $id: 'addMemberSchema',
    schema: addMemberSchema,
  },
  {
    $id: 'updateMemberSchema',
    schema: updateMemberSchema,
  },
  {
    $id: 'memberParamsSchema',
    schema: memberParamsSchema,
  },
  {
    $id: 'listMembersQuerySchema',
    schema: listMembersQuerySchema,
  },
  {
    $id: 'memberResponseSchema',
    schema: memberResponseSchema,
  },
]; 