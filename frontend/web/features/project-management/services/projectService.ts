import { apiClient } from '../../../services/api';
import { CreateProjectDto, Project, ProjectTemplate, UpdateProjectDto } from '../types';

const BASE_URL = '/api/projects';

export const projectService = {
  // Project CRUD operations
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get(BASE_URL);
    return response.data;
  },

  getProject: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get(`${BASE_URL}/${projectId}`);
    return response.data;
  },

  createProject: async (project: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.post(BASE_URL, project);
    return response.data;
  },

  updateProject: async (projectId: string, project: UpdateProjectDto): Promise<Project> => {
    const response = await apiClient.patch(`${BASE_URL}/${projectId}`, project);
    return response.data;
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${projectId}`);
  },

  archiveProject: async (projectId: string): Promise<Project> => {
    const response = await apiClient.patch(`${BASE_URL}/${projectId}/archive`);
    return response.data;
  },

  // Project team management
  addTeamMember: async (projectId: string, userId: string): Promise<Project> => {
    const response = await apiClient.post(`${BASE_URL}/${projectId}/team-members`, { userId });
    return response.data;
  },

  removeTeamMember: async (projectId: string, userId: string): Promise<Project> => {
    const response = await apiClient.delete(`${BASE_URL}/${projectId}/team-members/${userId}`);
    return response.data;
  },

  // Project templates
  getTemplates: async (): Promise<ProjectTemplate[]> => {
    const response = await apiClient.get(`${BASE_URL}/templates`);
    return response.data;
  },

  getTemplate: async (templateId: string): Promise<ProjectTemplate> => {
    const response = await apiClient.get(`${BASE_URL}/templates/${templateId}`);
    return response.data;
  },

  createTemplate: async (projectId: string, name: string, description: string): Promise<ProjectTemplate> => {
    const response = await apiClient.post(`${BASE_URL}/${projectId}/templates`, { name, description });
    return response.data;
  },

  applyTemplate: async (templateId: string, projectName: string): Promise<Project> => {
    const response = await apiClient.post(`${BASE_URL}/templates/${templateId}/apply`, { name: projectName });
    return response.data;
  },

  // Project duplication
  duplicateProject: async (projectId: string, newName: string): Promise<Project> => {
    const response = await apiClient.post(`${BASE_URL}/${projectId}/duplicate`, { name: newName });
    return response.data;
  }
};
