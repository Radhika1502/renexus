export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  teamMembers: string[];
}

export interface CreateProjectInput {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: 'low' | 'medium' | 'high';
  teamMembers: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  progress?: number;
  teamMembers?: string[];
}

export interface ProjectFilter {
  status?: 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  startDate?: string;
  endDate?: string;
  teamMember?: string;
}

export interface ProjectSort {
  field: 'name' | 'startDate' | 'endDate' | 'priority' | 'progress' | 'createdAt';
  order: 'asc' | 'desc';
} 