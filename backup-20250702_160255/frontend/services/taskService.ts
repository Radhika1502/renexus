import { Task } from '../components/tasks/TaskBoard';

// API endpoints
const API_BASE_URL = '/api';
const TASKS_ENDPOINT = `${API_BASE_URL}/tasks`;
const TASK_TEMPLATES_ENDPOINT = `${API_BASE_URL}/task-templates`;

// Task CRUD operations
export const fetchTasks = async (): Promise<Task[]> => {
  try {
    const response = await fetch(TASKS_ENDPOINT);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const getTaskById = async (taskId: string): Promise<Task> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${taskId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch task: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    throw error;
  }
};

export const createTask = async (taskData: Partial<Task>): Promise<Task> => {
  try {
    const response = await fetch(TASKS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, taskData: Partial<Task>): Promise<Task> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${taskId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: 'todo' | 'in_progress' | 'review' | 'done'): Promise<Task> => {
  return updateTask(taskId, { status });
};

// Task attachments
export const uploadAttachment = async (formData: FormData): Promise<any> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/attachments`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload attachment: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};

// Task dependencies
export const fetchTaskDependencies = async (taskId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${taskId}/dependencies`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dependencies: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching dependencies for task ${taskId}:`, error);
    throw error;
  }
};

export const addTaskDependency = async (taskId: string, dependsOnTaskId: string): Promise<any> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${taskId}/dependencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dependsOnTaskId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add dependency: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error adding dependency for task ${taskId}:`, error);
    throw error;
  }
};

export const removeTaskDependency = async (dependencyId: string): Promise<void> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/dependencies/${dependencyId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove dependency: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error removing dependency ${dependencyId}:`, error);
    throw error;
  }
};

export const fetchAvailableTasks = async (taskId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${taskId}/available-dependencies`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch available tasks: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching available tasks for ${taskId}:`, error);
    throw error;
  }
};

// Time tracking
export const fetchTimeEntries = async (taskId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${taskId}/time-entries`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch time entries: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching time entries for task ${taskId}:`, error);
    throw error;
  }
};

export const startTimeTracking = async (taskId: string, startTime: string): Promise<any> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${taskId}/time-entries/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startTime }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to start time tracking: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error starting time tracking for task ${taskId}:`, error);
    throw error;
  }
};

export const stopTimeTracking = async (
  taskId: string, 
  endTime: string, 
  duration: number,
  notes?: string
): Promise<any> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${taskId}/time-entries/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endTime, duration, notes }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to stop time tracking: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error stopping time tracking for task ${taskId}:`, error);
    throw error;
  }
};

export const createTimeEntry = async (timeEntryData: any): Promise<any> => {
  try {
    const response = await fetch(`${TASKS_ENDPOINT}/${timeEntryData.taskId}/time-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(timeEntryData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create time entry: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error creating time entry for task ${timeEntryData.taskId}:`, error);
    throw error;
  }
};

// Task templates
export const fetchTaskTemplates = async (projectId?: string): Promise<any[]> => {
  try {
    const url = projectId 
      ? `${TASK_TEMPLATES_ENDPOINT}?projectId=${projectId}`
      : TASK_TEMPLATES_ENDPOINT;
      
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch task templates: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching task templates:', error);
    throw error;
  }
};

export const createTemplate = async (templateData: any, projectId?: string): Promise<any> => {
  try {
    const response = await fetch(TASK_TEMPLATES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...templateData,
        projectId
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create template: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating task template:', error);
    throw error;
  }
};

export const createTaskFromTemplate = async (templateId: string, projectId?: string): Promise<any> => {
  try {
    const response = await fetch(`${TASK_TEMPLATES_ENDPOINT}/${templateId}/create-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create task from template: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error creating task from template ${templateId}:`, error);
    throw error;
  }
};

export const deleteTemplate = async (templateId: string): Promise<void> => {
  try {
    const response = await fetch(`${TASK_TEMPLATES_ENDPOINT}/${templateId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete template: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting template ${templateId}:`, error);
    throw error;
  }
};
