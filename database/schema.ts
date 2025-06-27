import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tenants table
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  mfaEnabled: boolean('mfa_enabled').default(false),
  mfaSecret: text('mfa_secret'),
  mfaTempSecret: text('mfa_temp_secret'),
  mfaPhoneNumber: varchar('mfa_phone_number', { length: 20 }),
  mfaRecoveryCodes: text('mfa_recovery_codes'),
  mfaType: varchar('mfa_type', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLogin: timestamp('last_login'),
});

// Tenant users (join table for multi-tenant access)
export const tenantUsers = pgTable('tenant_users', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Teams table
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Team members table
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project members table
export const projectMembers = pgTable('project_members', {
  id: uuid('id').primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('todo'),
  priority: varchar('priority', { length: 50 }).notNull().default('medium'),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  estimatedHours: numeric('estimated_hours', { precision: 10, scale: 2 }),
  dueDate: timestamp('due_date'),
  category: varchar('category', { length: 100 }),
  customFields: jsonb('custom_fields'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Task assignees table
export const taskAssignees = pgTable('task_assignees', {
  id: uuid('id').primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow(),
});

// Project templates table
export const projectTemplates = pgTable('project_templates', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Task templates table
export const taskTemplates = pgTable('task_templates', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  taskDescription: text('task_description'),
  status: varchar('status', { length: 50 }).default('todo'),
  priority: varchar('priority', { length: 50 }).default('medium'),
  estimatedHours: numeric('estimated_hours', { precision: 10, scale: 2 }),
  category: varchar('category', { length: 100 }),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define relations
export const tenantsRelations = relations(tenants, ({ many }: { many: any }) => ({
  users: many(tenantUsers),
  teams: many(teams),
  projects: many(projects),
  tasks: many(tasks),
  projectTemplates: many(projectTemplates),
  taskTemplates: many(taskTemplates),
}));

export const usersRelations = relations(users, ({ many }: { many: any }) => ({
  tenants: many(tenantUsers),
  teams: many(teamMembers),
  projects: many(projectMembers),
  tasks: many(taskAssignees),
  createdProjects: many(projects, { relationName: 'creator' }),
  createdTasks: many(tasks, { relationName: 'creator' }),
  sessions: many(sessions),
}));

export const projectsRelations = relations(projects, ({ one, many }: { one: any, many: any }) => ({
  tenant: one(tenants, {
    fields: [projects.tenantId],
    references: [tenants.id],
  }),
  creator: one(users, {
    fields: [projects.createdById],
    references: [users.id],
    relationName: 'creator',
  }),
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  members: many(projectMembers),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }: { one: any, many: any }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  tenant: one(tenants, {
    fields: [tasks.tenantId],
    references: [tenants.id],
  }),
  creator: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: 'creator',
  }),
  assignees: many(taskAssignees),
}));

export const projectTemplatesRelations = relations(projectTemplates, ({ one, many }: { one: any, many: any }) => ({
  tenant: one(tenants, {
    fields: [projectTemplates.tenantId],
    references: [tenants.id],
  }),
  creator: one(users, {
    fields: [projectTemplates.createdById],
    references: [users.id],
  }),
  defaultTasks: many(taskTemplates),
}));

export const taskTemplatesRelations = relations(taskTemplates, ({ one }: { one: any }) => ({
  tenant: one(tenants, {
    fields: [taskTemplates.tenantId],
    references: [tenants.id],
  }),
  creator: one(users, {
    fields: [taskTemplates.createdById],
    references: [users.id],
  }),
}));

// Sessions table for user session management
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastActivityAt: timestamp('last_activity_at').defaultNow(),
});

// Define session relations
export const sessionsRelations = relations(sessions, ({ one }: { one: any }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Sessions relations are now included in the usersRelations above
