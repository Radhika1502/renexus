import { pgTable, serial, text, timestamp, boolean, integer, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('active'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('todo'),
  priority: text('priority').default('medium'),
  assigneeId: uuid('assignee_id').references(() => users.id),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  metadata: jsonb('metadata'),
});

// Task dependencies table
export const taskDependencies = pgTable('task_dependencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  dependsOnTaskId: uuid('depends_on_task_id').references(() => tasks.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Time tracking entries table
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Task attachments table
export const taskAttachments = pgTable('task_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  filePath: text('file_path').notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// Task templates table
export const taskTemplates = pgTable('task_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  defaultStatus: text('default_status').default('todo'),
  defaultPriority: text('default_priority').default('medium'),
  templateFields: jsonb('template_fields'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks, { relationName: 'assignee' }),
  createdTasks: many(tasks, { relationName: 'creator' }),
  createdProjects: many(projects, { relationName: 'creator' }),
  timeEntries: many(timeEntries),
  uploadedAttachments: many(taskAttachments, { relationName: 'uploader' }),
}));

export const projectsRelations = relations(projects, ({ many, one }) => ({
  tasks: many(tasks),
  creator: one(users, { fields: [projects.createdBy], references: [users.id], relationName: 'creator' }),
}));

export const tasksRelations = relations(tasks, ({ many, one }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id], relationName: 'assignee' }),
  creator: one(users, { fields: [tasks.createdBy], references: [users.id], relationName: 'creator' }),
  dependencies: many(taskDependencies, { relationName: 'task' }),
  dependents: many(taskDependencies, { relationName: 'dependent' }),
  timeEntries: many(timeEntries),
  attachments: many(taskAttachments),
}));

export const taskDependenciesRelations = relations(taskDependencies, ({ one }) => ({
  task: one(tasks, { fields: [taskDependencies.taskId], references: [tasks.id], relationName: 'task' }),
  dependsOn: one(tasks, { fields: [taskDependencies.dependsOnTaskId], references: [tasks.id], relationName: 'dependent' }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  task: one(tasks, { fields: [timeEntries.taskId], references: [tasks.id] }),
  user: one(users, { fields: [timeEntries.userId], references: [users.id] }),
}));

export const taskAttachmentsRelations = relations(taskAttachments, ({ one }) => ({
  task: one(tasks, { fields: [taskAttachments.taskId], references: [tasks.id] }),
  uploader: one(users, { fields: [taskAttachments.uploadedBy], references: [users.id], relationName: 'uploader' }),
}));
