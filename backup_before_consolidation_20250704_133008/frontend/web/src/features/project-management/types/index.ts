import { User } from '../../team-management/types';

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  teamMembers?: User[];
  ownerId: string;
  owner?: User;
  customFields?: Record<string, any>;
  tags?: string[];
}

export interface CreateProjectDto {
  name: string;
  description: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  teamMemberIds?: string[];
  customFields?: Record<string, any>;
  tags?: string[];
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  teamMemberIds?: string[];
  customFields?: Record<string, any>;
  tags?: string[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    tasks: Array<{
      title: string;
      description: string;
      status: string;
      priority: string;
      estimatedHours?: number;
    }>;
    customFields: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectView {
  id: string;
  name: string;
  type: 'board' | 'list' | 'calendar' | 'gantt';
  filters: Record<string, any>;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPermission {
  userId: string;
  projectId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canManagePermissions: boolean;
  };
}
