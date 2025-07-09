import axios from 'axios';
import { Project, CreateProjectInput, UpdateProjectInput, ProjectFilter, ProjectSort } from '../types/project';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const projectApi = {
  // Get a single project by ID
  getProject: async (projectId: string): Promise<Project> => {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
    return response.data;
  },

  // Get a list of projects with filtering, sorting, and pagination
  listProjects: async (
    filter?: ProjectFilter,
    sort?: ProjectSort,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    projects: Project[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> => {
    const response = await axios.get(`${API_BASE_URL}/projects`, {
      params: {
        ...filter,
        sortField: sort?.field,
        sortOrder: sort?.order,
        page,
        pageSize,
      },
    });
    return response.data;
  },

  // Create a new project
  createProject: async (project: CreateProjectInput): Promise<Project> => {
    const response = await axios.post(`${API_BASE_URL}/projects`, project);
    return response.data;
  },

  // Update an existing project
  updateProject: async (projectId: string, updates: UpdateProjectInput): Promise<Project> => {
    const response = await axios.put(`${API_BASE_URL}/projects/${projectId}`, updates);
    return response.data;
  },

  // Delete a project
  deleteProject: async (projectId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/projects/${projectId}`);
  },

  // Get project members
  getProjectMembers: async (projectId: string): Promise<{
    userId: string;
    role: string;
    joinedAt: string;
  }[]> => {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/members`);
    return response.data;
  },

  // Add project member
  addProjectMember: async (
    projectId: string,
    userId: string,
    role: string
  ): Promise<void> => {
    await axios.post(`${API_BASE_URL}/projects/${projectId}/members`, {
      userId,
      role,
    });
  },

  // Update project member role
  updateProjectMember: async (
    projectId: string,
    userId: string,
    role: string
  ): Promise<void> => {
    await axios.patch(`${API_BASE_URL}/projects/${projectId}/members/${userId}`, {
      role,
    });
  },

  // Remove project member
  removeProjectMember: async (projectId: string, userId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/projects/${projectId}/members/${userId}`);
  },

  // Get project statistics
  getProjectStats: async (projectId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    tasksByStatus: Record<string, number>;
    tasksByPriority: Record<string, number>;
    tasksByAssignee: Record<string, number>;
    timeSpent: number;
    timeEstimated: number;
    progress: number;
  }> => {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/stats`);
    return response.data;
  },

  // Get project history
  getProjectHistory: async (projectId: string): Promise<{
    id: string;
    projectId: string;
    userId: string;
    action: string;
    changes: Record<string, any>;
    timestamp: string;
  }[]> => {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/history`);
    return response.data;
  },
}; 