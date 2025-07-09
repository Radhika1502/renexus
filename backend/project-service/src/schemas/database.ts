import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  tenantId: uuid('tenant_id').notNull(),
  createdById: uuid('created_by_id').notNull(),
  teamId: uuid('team_id'),
  startDate: timestamp('start_date', { mode: 'date' }),
  endDate: timestamp('end_date', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
});

// Project members table
export const projectMembers = pgTable('project_members', {
  id: uuid('id').primaryKey().notNull(),
  projectId: uuid('project_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
});

// Project templates table
export const projectTemplates = pgTable('project_templates', {
  id: uuid('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  tenantId: uuid('tenant_id').notNull(),
  createdById: uuid('created_by_id').notNull(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
});

// Task templates table
export const taskTemplates = pgTable('task_templates', {
  id: uuid('id').primaryKey().notNull(),
  projectTemplateId: uuid('project_template_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  tenantId: uuid('tenant_id').notNull(),
  createdById: uuid('created_by_id').notNull(),
  status: varchar('status', { length: 50 }).default('todo'),
  priority: varchar('priority', { length: 50 }).default('medium'),
  category: varchar('category', { length: 100 }),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
});

// Tasks table (simplified for template operations)
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('todo'),
  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  projectId: uuid('project_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),
  createdById: uuid('created_by_id').notNull(),
  dueDate: timestamp('due_date', { mode: 'date' }),
  category: varchar('category', { length: 100 }),
  metadata: jsonb('custom_fields'),
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`),
}); 