import { z } from 'zod';

// Base relationship schema
const relationshipSchema = z.object({
  id: z.string().uuid(),
  sourceTaskId: z.string().uuid(),
  targetTaskId: z.string().uuid(),
  type: z.enum(['blocks', 'subtask']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Create relationship schema
export const createRelationshipSchema = relationshipSchema
  .omit({ id: true, createdAt: true, updatedAt: true });

// Relationship params schema
export const relationshipParamsSchema = z.object({
  sourceTaskId: z.string().uuid(),
  targetTaskId: z.string().uuid(),
});

// List relationships query schema
export const listRelationshipsQuerySchema = z.object({
  taskId: z.string().uuid(),
  type: relationshipSchema.shape.type.optional(),
  direction: z.enum(['incoming', 'outgoing']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Relationship response schema
export const relationshipResponseSchema = relationshipSchema;

// Export all schemas for Fastify
export const relationshipSchemas = [
  {
    $id: 'createRelationshipSchema',
    schema: createRelationshipSchema,
  },
  {
    $id: 'relationshipParamsSchema',
    schema: relationshipParamsSchema,
  },
  {
    $id: 'listRelationshipsQuerySchema',
    schema: listRelationshipsQuerySchema,
  },
  {
    $id: 'relationshipResponseSchema',
    schema: relationshipResponseSchema,
  },
]; 