// Base API URL
const API_URL = '/api/tasks';

// Interface for task dependency
export interface TaskDependency {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  type: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicates' | 'parent_of' | 'child_of';
  createdAt: string;
}

// Interface for creating a task dependency
export interface CreateTaskDependencyDto {
  sourceTaskId: string;
  targetTaskId: string;
  type: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicates' | 'parent_of' | 'child_of';
}

// Interface for circular dependency check result
export interface CircularDependencyResult {
  hasCircularDependency: boolean;
  path: string[];
}

/**
 * Create a new task dependency
 * @param dependency The dependency data to create
 * @returns The created dependency
 */
export const createTaskDependency = async (dependency: CreateTaskDependencyDto): Promise<TaskDependency> => {
  const response = await fetch(`${API_URL}/dependencies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dependency),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task dependency: ${response.status}`);
  }

  return response.json();
};

/**
 * Get all dependencies for a task
 * @param taskId The task ID
 * @returns Array of task dependencies
 */
export const getTaskDependencies = async (taskId: string): Promise<TaskDependency[]> => {
  const response = await fetch(`${API_URL}/${taskId}/dependencies`);

  if (!response.ok) {
    throw new Error(`Failed to get task dependencies: ${response.status}`);
  }

  return response.json();
};

/**
 * Remove a task dependency
 * @param id The dependency ID
 * @returns True if deletion was successful
 */
export const removeTaskDependency = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_URL}/dependencies/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to remove task dependency: ${response.status}`);
  }

  return response.status === 204;
};

/**
 * Check if adding a dependency would create a circular dependency
 * @param sourceTaskId The source task ID
 * @param targetTaskId The target task ID
 * @returns Object with circular dependency check result
 */
export const checkCircularDependency = async (
  sourceTaskId: string,
  targetTaskId: string
): Promise<CircularDependencyResult> => {
  const response = await fetch(`${API_URL}/dependencies/check-circular`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sourceTaskId, targetTaskId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to check circular dependency: ${response.status}`);
  }

  return response.json();
};
