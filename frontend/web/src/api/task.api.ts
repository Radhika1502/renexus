import { Task, CreateTaskInput, UpdateTaskInput, TaskFilter, TaskSort } from '../types/task';
import { mockApi } from '../services/mockApi';

export const taskApi = {
  getTasks: async (
    filter?: TaskFilter,
    sort?: TaskSort,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ data: Task[]; total: number }> => {
    return mockApi.getTasks(filter, sort);
  },

  getTaskById: async (id: string): Promise<Task> => {
    return mockApi.getTaskById(id);
  },

  createTask: async (input: CreateTaskInput): Promise<Task> => {
    return mockApi.createTask(input);
  },

  updateTask: async (id: string, input: UpdateTaskInput): Promise<Task> => {
    return mockApi.updateTask(id, input);
  },

  deleteTask: async (id: string): Promise<void> => {
    return mockApi.deleteTask(id);
  },
}; 