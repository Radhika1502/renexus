// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
  organizationId: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  language: string;
  timezone: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  desktop: boolean;
  mentions: boolean;
  taskAssigned: boolean;
  taskDue: boolean;
  projectUpdates: boolean;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  logo?: string;
  plan: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
  settings: OrganizationSettings;
  members: OrganizationMember[];
}

export interface OrganizationSettings {
  defaultRole: UserRole;
  allowGuestAccess: boolean;
  securitySettings: SecuritySettings;
  customFields?: Record<string, CustomField>;
}

export interface SecuritySettings {
  mfaRequired: boolean;
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number; // in minutes
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays: number;
}

export interface OrganizationMember {
  userId: string;
  role: UserRole;
  joinedAt: string;
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  ownerId: string;
  organizationId: string;
  members: ProjectMember[];
  tags: string[];
  customFields?: Record<string, any>;
  visibility: ProjectVisibility;
  icon?: string;
  color?: string;
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum ProjectVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  TEAM = 'TEAM',
}

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  joinedAt: string;
}

export enum ProjectRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  createdById: string;
  assigneeId?: string;
  projectId: string;
  parentTaskId?: string;
  subtasks?: Task[];
  tags: string[];
  attachments: Attachment[];
  comments: Comment[];
  customFields?: Record<string, any>;
  estimatedHours?: number;
  actualHours?: number;
  dependencies: TaskDependency[];
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface TaskDependency {
  taskId: string;
  type: DependencyType;
}

export enum DependencyType {
  BLOCKS = 'BLOCKS',
  BLOCKED_BY = 'BLOCKED_BY',
  RELATES_TO = 'RELATES_TO',
  DUPLICATES = 'DUPLICATES',
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  taskId: string;
  parentCommentId?: string;
  mentions: string[]; // User IDs
  attachments: Attachment[];
}

// Attachment Types
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: string;
  uploadedById: string;
}

// Custom Field Types
export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: string[];
  required: boolean;
}

export enum CustomFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  CHECKBOX = 'CHECKBOX',
  URL = 'URL',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

// AI Types
export interface AIAssistant {
  id: string;
  name: string;
  description?: string;
  capabilities: AICapability[];
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  settings: AIAssistantSettings;
}

export interface AIAssistantSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  customInstructions?: string;
}

export enum AICapability {
  TASK_SUMMARIZATION = 'TASK_SUMMARIZATION',
  MEETING_NOTES = 'MEETING_NOTES',
  CODE_GENERATION = 'CODE_GENERATION',
  CONTENT_WRITING = 'CONTENT_WRITING',
  DATA_ANALYSIS = 'DATA_ANALYSIS',
  TASK_PRIORITIZATION = 'TASK_PRIORITIZATION',
}

// Notification Types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId: string;
  data: Record<string, any>;
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMMENTED = 'TASK_COMMENTED',
  TASK_DUE_SOON = 'TASK_DUE_SOON',
  TASK_OVERDUE = 'TASK_OVERDUE',
  MENTION = 'MENTION',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_MEMBER_ADDED = 'PROJECT_MEMBER_ADDED',
  SYSTEM = 'SYSTEM',
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Authentication Types
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Analytics Types
export interface AnalyticsData {
  timeRange: TimeRange;
  metrics: Metric[];
  breakdown?: BreakdownDimension;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface Metric {
  name: MetricName;
  value: number;
  change?: number; // percentage change from previous period
}

export enum MetricName {
  TASKS_CREATED = 'TASKS_CREATED',
  TASKS_COMPLETED = 'TASKS_COMPLETED',
  COMPLETION_RATE = 'COMPLETION_RATE',
  AVERAGE_COMPLETION_TIME = 'AVERAGE_COMPLETION_TIME',
  OVERDUE_TASKS = 'OVERDUE_TASKS',
  ACTIVE_USERS = 'ACTIVE_USERS',
}

export enum BreakdownDimension {
  USER = 'USER',
  PROJECT = 'PROJECT',
  STATUS = 'STATUS',
  PRIORITY = 'PRIORITY',
  TAG = 'TAG',
}

// Webhook Types
export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export enum WebhookEvent {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  USER_CREATED = 'USER_CREATED',
}

// Integration Types
export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  config: Record<string, any>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export enum IntegrationType {
  GITHUB = 'GITHUB',
  SLACK = 'SLACK',
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
  JIRA = 'JIRA',
  CUSTOM = 'CUSTOM',
}
