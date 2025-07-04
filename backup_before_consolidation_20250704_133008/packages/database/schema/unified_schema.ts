import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  timestamp, 
  varchar, 
  jsonb, 
  uuid,
  real,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Multi-tenancy Core Tables
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  domain: varchar("domain").unique(),
  plan: varchar("plan").default("free"), // free, starter, pro, enterprise
  status: varchar("status").notNull().default("active"), // active, suspended, cancelled
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table with enhanced features
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("member"), // super_admin, admin, manager, member
  status: varchar("status").notNull().default("active"), // active, away, busy, offline
  timezone: varchar("timezone").default("UTC"),
  language: varchar("language").default("en"),
  preferences: jsonb("preferences").default({}),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenant users junction table
export const tenantUsers = pgTable("tenant_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").notNull().default("member"), // owner, admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#8B5CF6"),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members junction table
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").references(() => teams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").notNull().default("member"), // lead, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Projects table with enhanced features
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("active"), // planning, active, on_hold, completed, cancelled
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, critical
  progress: integer("progress").default(0), // 0-100
  color: varchar("color").default("#3B82F6"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  dueDate: timestamp("due_date"),
  budget: real("budget"),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  teamId: uuid("team_id").references(() => teams.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project members junction table
export const projectMembers = pgTable("project_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").notNull().default("member"), // owner, manager, member, viewer
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Versions table (from project-bolt)
export const versions = pgTable("versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  status: varchar("status").notNull().default("planning"), // planning, development, testing, released
  releaseDate: timestamp("release_date"),
  features: jsonb("features").default([]),
  bugFixes: jsonb("bug_fixes").default([]),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Portfolios table
export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Portfolio projects junction table
export const portfolioProjects = pgTable("portfolio_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").references(() => portfolios.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Epics table with enhanced features
export const epics = pgTable("epics", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  status: varchar("status").notNull().default("todo"), // todo, in_progress, done
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, critical
  assigneeId: varchar("assignee_id").references(() => users.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Stories table with enhanced features
export const userStories = pgTable("user_stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  epicId: uuid("epic_id").references(() => epics.id),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  status: varchar("status").notNull().default("todo"), // todo, in_progress, testing, done
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, critical
  assigneeId: varchar("assignee_id").references(() => users.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  estimatedHours: real("estimated_hours"),
  actualHours: real("actual_hours"),
  createdAt: timestamp("created_at").defaultNow(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sprints table
export const sprints = pgTable("sprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  status: varchar("status").notNull().default("planned"), // planned, active, completed
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  goal: text("goal"),
  velocity: real("velocity"),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("todo"), // todo, in_progress, review, testing, done
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, critical
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  assigneeId: varchar("assignee_id").references(() => users.id),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  parentTaskId: uuid("parent_task_id").references(() => tasks.id),
  userStoryId: uuid("user_story_id").references(() => userStories.id),
  sprintId: uuid("sprint_id").references(() => sprints.id),
  estimatedHours: real("estimated_hours"),
  actualHours: real("actual_hours"),
  progress: integer("progress").default(0), // 0-100
  complexity: varchar("complexity").default("medium"), // simple, medium, complex
  tags: jsonb("tags").default([]),
  customFields: jsonb("custom_fields").default({}),
  aiPriority: real("ai_priority"), // AI-calculated priority score
  aiEffortEstimate: real("ai_effort_estimate"), // AI estimated hours
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task dependencies
export const taskDependencies = pgTable("task_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  dependsOnTaskId: uuid("depends_on_task_id").references(() => tasks.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bugs table (from project-bolt)
export const bugs = pgTable("bugs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  severity: varchar("severity").notNull().default("medium"), // low, medium, high, critical
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, critical
  status: varchar("status").notNull().default("new"), // new, assigned, in_progress, resolved, closed
  assigneeId: varchar("assignee_id").references(() => users.id),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  steps: jsonb("steps").default([]),
  environment: text("environment"),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  taskId: uuid("task_id").references(() => tasks.id),
  bugId: uuid("bug_id").references(() => bugs.id),
  projectId: uuid("project_id").references(() => projects.id),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  mentions: jsonb("mentions"), // array of user IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Files/Attachments table
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  url: varchar("url").notNull(),
  taskId: uuid("task_id").references(() => tasks.id),
  bugId: uuid("bug_id").references(() => bugs.id),
  projectId: uuid("project_id").references(() => projects.id),
  uploadedById: varchar("uploaded_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Time tracking table
export const timeEntries = pgTable("time_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  description: text("description"),
  hours: real("hours").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity logs
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type").notNull(), // task_created, task_updated, comment_added, etc.
  description: text("description").notNull(),
  entityType: varchar("entity_type").notNull(), // task, project, comment
  entityId: uuid("entity_id").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI suggestions table
export const aiSuggestions = pgTable("ai_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type").notNull(), // priority, timeline, resource, task_breakdown
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  targetType: varchar("target_type").notNull(), // task, project, team
  targetId: uuid("target_id").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, accepted, rejected
  confidence: real("confidence"), // 0-1
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  appliedAt: timestamp("applied_at"),
});

// AI insights table (from project-bolt)
export const aiInsights = pgTable("ai_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type").notNull(), // task-suggestion, risk-analysis, sprint-recommendation, bug-pattern
  content: text("content").notNull(),
  confidence: real("confidence").notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  actionable: boolean("actionable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isRead: boolean("is_read").default(false),
  entityType: varchar("entity_type"),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Communication channels table (from project-bolt)
export const communicationChannels = pgTable("communication_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull().default("text"), // text, voice, video
  projectId: uuid("project_id").references(() => projects.id),
  teamId: uuid("team_id").references(() => teams.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Channel participants junction table
export const channelParticipants = pgTable("channel_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").references(() => communicationChannels.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").default("member"), // admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  channelId: uuid("channel_id").references(() => communicationChannels.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  mentions: jsonb("mentions").default([]),
  attachments: jsonb("attachments").default([]),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video meetings table
export const videoMeetings = pgTable("video_meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  projectId: uuid("project_id").references(() => projects.id),
  teamId: uuid("team_id").references(() => teams.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  hostId: varchar("host_id").references(() => users.id).notNull(),
  meetingUrl: varchar("meeting_url"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: varchar("status").default("scheduled"), // scheduled, in_progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting participants junction table
export const meetingParticipants = pgTable("meeting_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").references(() => videoMeetings.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: varchar("status").default("invited"), // invited, accepted, declined, attended
  joinedAt: timestamp("joined_at"),
  leftAt: timestamp("left_at"),
});

// Risks table
export const risks = pgTable("risks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  description: text("description"),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  probability: varchar("probability").notNull().default("medium"), // low, medium, high
  impact: varchar("impact").notNull().default("medium"), // low, medium, high
  status: varchar("status").notNull().default("identified"), // identified, analyzed, mitigated, accepted, closed
  ownerId: varchar("owner_id").references(() => users.id),
  mitigationPlan: text("mitigation_plan"),
  contingencyPlan: text("contingency_plan"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflows table
export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  projectId: uuid("project_id").references(() => projects.id),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  isActive: boolean("is_active").default(true),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table: any) => [index("IDX_session_expire").on(table.expire)],
);
