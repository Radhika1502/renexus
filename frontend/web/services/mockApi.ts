import { Task, CreateTaskInput, UpdateTaskInput, TaskFilter, TaskSort } from '../types/task';
import { mockTasks } from '../test/mocks/data';

export const mockApi = {
  getTasks: async (
    filter?: TaskFilter,
    sort?: TaskSort,
  ): Promise<{ data: Task[]; total: number }> => {
    let filteredTasks = [...mockTasks];

    // Apply filters
    if (filter) {
      if (filter.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filter.status);
      }
      if (filter.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
      }
      if (filter.assignedTo) {
        filteredTasks = filteredTasks.filter(task => task.assignedTo === filter.assignedTo);
      }
      if (filter.projectId) {
        filteredTasks = filteredTasks.filter(task => task.projectId === filter.projectId);
      }
      if (filter.tags?.length) {
        filteredTasks = filteredTasks.filter(task =>
          filter.tags!.some(tag => task.tags.includes(tag))
        );
      }
    }

    // Apply sorting
    if (sort) {
      filteredTasks.sort((a, b) => {
        const aValue = a[sort.field];
        const bValue = b[sort.field];
        const order = sort.order === 'asc' ? 1 : -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * order;
        }
        return ((aValue as any) - (bValue as any)) * order;
      });
    }

    return {
      data: filteredTasks,
      total: filteredTasks.length,
    };
  },

  getTaskById: async (id: string): Promise<Task> => {
    const task = mockTasks.find(t => t.id === id);
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  },

  createTask: async (input: CreateTaskInput): Promise<Task> => {
    const newTask: Task = {
      id: String(mockTasks.length + 1),
      ...input,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: '1', // Mock user ID
      comments: [],
      tags: input.tags || [],
    };
    mockTasks.push(newTask);
    return newTask;
  },

  updateTask: async (id: string, input: UpdateTaskInput): Promise<Task> => {
    const taskIndex = mockTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const updatedTask = {
      ...mockTasks[taskIndex],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    mockTasks[taskIndex] = updatedTask;
    return updatedTask;
  },

  deleteTask: async (id: string): Promise<void> => {
    const taskIndex = mockTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    mockTasks.splice(taskIndex, 1);
  },
}; 