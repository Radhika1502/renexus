// Project Management Types
export interface Project {
  id: string;
  name: string;
  description: string;
  key: string;
  lead: User;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'manager' | 'developer' | 'tester' | 'viewer';

export type ProjectStatus = 'planning' | 'active' | 'onHold' | 'completed' | 'cancelled';

export interface ProjectFilters {
  status?: ProjectStatus[];
  teamId?: string;
  leadId?: string;
  search?: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  key: string;
  leadId: string;
  teamId: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  leadId?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}
