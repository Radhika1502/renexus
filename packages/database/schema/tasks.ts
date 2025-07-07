import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { users } from './users';

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  dueDate: timestamp('due_date'),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  completedAt: timestamp('completed_at'),
}); 