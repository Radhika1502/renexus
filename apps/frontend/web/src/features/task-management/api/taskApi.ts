import { Task, TaskStatus, TaskPriority } from '../types';

// Base API URL
const API_URL = '/api/tasks';

// Interface for creating a new task
export interface CreateTaskDto {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

// Interface for updating a task
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
}

/**
 * Create a new task
 * @param task The task data to create
 * @returns The created task
 */
export const createTask = async (task: CreateTaskDto): Promise<Task> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.status}`);
  }

  return response.json();
};

/**
 * Get a task by ID
 * @param id The task ID
 * @returns The task data
 */
export const getTask = async (id: string): Promise<Task> => {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to get task: ${response.status}`);
  }

  return response.json();
};

/**
 * Get all tasks
 * @returns Array of tasks
 */
export const getAllTasks = async (): Promise<Task[]> => {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to get tasks: ${response.status}`);
  }

  return response.json();
};

/**
 * Update a task
 * @param id The task ID
 * @param task The task data to update
 * @returns The updated task
 */
export const updateTask = async (id: string, task: UpdateTaskDto): Promise<Task> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task: ${response.status}`);
  }

  return response.json();
};

/**
 * Delete a task
 * @param id The task ID
 * @returns True if deletion was successful
 */
export const deleteTask = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete task: ${response.status}`);
  }

  return response.status === 204;
};
