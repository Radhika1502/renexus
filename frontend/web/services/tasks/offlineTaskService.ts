import { Task } from '../../components/tasks/TaskBoard';
import * as taskService from '../taskService';
import createOfflineAwareClient from '../api/offlineAwareClient';

/**
 * Create an offline-aware task service that wraps the original task service
 * and adds offline support for all operations
 */

// Create a base client object from the individual task service functions
const baseTaskClient = {
  tasks: {
    getAll: taskService.fetchTasks,
    get: taskService.getTaskById,
    create: taskService.createTask,
    update: taskService.updateTask,
    delete: taskService.deleteTask,
    updateStatus: taskService.updateTaskStatus,
  },
  attachments: {
    upload: taskService.uploadAttachment,
  },
  dependencies: {
    getAll: taskService.fetchTaskDependencies,
    create: taskService.addTaskDependency,
    delete: taskService.removeTaskDependency,
    getAvailable: taskService.fetchAvailableTasks,
  },
  timeEntries: {
    getAll: taskService.fetchTimeEntries,
    start: taskService.startTimeTracking,
    stop: taskService.stopTimeTracking,
    create: taskService.createTimeEntry,
  },
  templates: {
    getAll: taskService.fetchTaskTemplates,
    create: taskService.createTemplate,
    createTaskFrom: taskService.createTaskFromTemplate,
    delete: taskService.deleteTemplate,
  },
};

// Create an offline-aware client
const offlineTaskClient = createOfflineAwareClient(baseTaskClient);

// Export individual functions with the same interface as the original task service
export const fetchTasks = async (): Promise<Task[]> => {
  return offlineTaskClient.tasks.getAll();
};

export const getTaskById = async (taskId: string): Promise<Task> => {
  return offlineTaskClient.tasks.get(taskId);
};

export const createTask = async (taskData: Partial<Task>): Promise<Task> => {
  return offlineTaskClient.tasks.create(taskData);
};

export const updateTask = async (taskId: string, taskData: Partial<Task>): Promise<Task> => {
  return offlineTaskClient.tasks.update(taskId, taskData);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  return offlineTaskClient.tasks.delete(taskId);
};

export const updateTaskStatus = async (taskId: string, status: 'todo' | 'in_progress' | 'review' | 'done'): Promise<Task> => {
  return offlineTaskClient.tasks.updateStatus(taskId, status);
};

export const uploadAttachment = async (formData: FormData): Promise<any> => {
  return offlineTaskClient.attachments.upload(formData);
};

export const fetchTaskDependencies = async (taskId: string): Promise<any[]> => {
  return offlineTaskClient.dependencies.getAll(taskId);
};

export const addTaskDependency = async (taskId: string, dependsOnTaskId: string): Promise<any> => {
  return offlineTaskClient.dependencies.create(taskId, dependsOnTaskId);
};

export const removeTaskDependency = async (dependencyId: string): Promise<void> => {
  return offlineTaskClient.dependencies.delete(dependencyId);
};

export const fetchAvailableTasks = async (taskId: string): Promise<any[]> => {
  return offlineTaskClient.dependencies.getAvailable(taskId);
};

export const fetchTimeEntries = async (taskId: string): Promise<any[]> => {
  return offlineTaskClient.timeEntries.getAll(taskId);
};

export const startTimeTracking = async (taskId: string, startTime: string): Promise<any> => {
  return offlineTaskClient.timeEntries.start(taskId, startTime);
};

export const stopTimeTracking = async (
  taskId: string,
  endTime: string,
  duration: number,
  notes?: string
): Promise<any> => {
  return offlineTaskClient.timeEntries.stop(taskId, endTime, duration, notes);
};

export const createTimeEntry = async (timeEntryData: any): Promise<any> => {
  return offlineTaskClient.timeEntries.create(timeEntryData);
};

export const fetchTaskTemplates = async (projectId?: string): Promise<any[]> => {
  return offlineTaskClient.templates.getAll(projectId);
};

export const createTemplate = async (templateData: any, projectId?: string): Promise<any> => {
  return offlineTaskClient.templates.create(templateData, projectId);
};

export const createTaskFromTemplate = async (templateId: string, projectId?: string): Promise<any> => {
  return offlineTaskClient.templates.createTaskFrom(templateId, projectId);
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  return offlineTaskClient.templates.delete(templateId);
};

// Export the client directly for advanced use cases
export default offlineTaskClient;
