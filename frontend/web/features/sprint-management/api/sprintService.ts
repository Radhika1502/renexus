import { api } from '../../../services/api';
import {
  Sprint,
  CreateSprintDto,
  UpdateSprintDto,
  SprintTask,
  AddTaskToSprintDto,
  SprintStats,
  SprintVelocity
} from '../types';

const BASE_URL = '/sprints';

export const sprintService = {
  // Sprint CRUD operations
  getAllSprints: async (projectId?: string): Promise<Sprint[]> => {
    const url = projectId ? `${BASE_URL}?projectId=${projectId}` : BASE_URL;
    const response = await api.get(url);
    return response.data;
  },

  getSprint: async (id: string): Promise<Sprint> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createSprint: async (data: CreateSprintDto): Promise<Sprint> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  updateSprint: async (id: string, data: UpdateSprintDto): Promise<Sprint> => {
    const response = await api.patch(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteSprint: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Sprint status operations
  startSprint: async (id: string): Promise<Sprint> => {
    const response = await api.post(`${BASE_URL}/${id}/start`);
    return response.data;
  },

  completeSprint: async (id: string): Promise<Sprint> => {
    const response = await api.post(`${BASE_URL}/${id}/complete`);
    return response.data;
  },

  cancelSprint: async (id: string): Promise<Sprint> => {
    const response = await api.post(`${BASE_URL}/${id}/cancel`);
    return response.data;
  },

  // Sprint tasks operations
  getSprintTasks: async (sprintId: string): Promise<SprintTask[]> => {
    const response = await api.get(`${BASE_URL}/${sprintId}/tasks`);
    return response.data;
  },

  addTaskToSprint: async (sprintId: string, data: AddTaskToSprintDto): Promise<SprintTask> => {
    const response = await api.post(`${BASE_URL}/${sprintId}/tasks`, data);
    return response.data;
  },

  removeTaskFromSprint: async (sprintId: string, taskId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${sprintId}/tasks/${taskId}`);
  },

  // Sprint analytics
  getSprintStats: async (sprintId: string): Promise<SprintStats> => {
    const response = await api.get(`${BASE_URL}/${sprintId}/stats`);
    return response.data;
  },

  getSprintVelocity: async (projectId: string): Promise<SprintVelocity[]> => {
    const response = await api.get(`/projects/${projectId}/sprint-velocity`);
    return response.data;
  }
};
