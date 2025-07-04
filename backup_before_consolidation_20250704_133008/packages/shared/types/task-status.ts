/**
 * Standardized task status enum to be used across frontend and backend
 */
export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  REVIEW = 'review',
  DONE = 'done'
}

/**
 * Helper function to validate task status
 */
export function isValidTaskStatus(status: string): boolean {
  return Object.values(TaskStatus).includes(status as TaskStatus);
}

/**
 * Display names for task statuses
 */
export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: 'Backlog',
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.BLOCKED]: 'Blocked',
  [TaskStatus.REVIEW]: 'In Review',
  [TaskStatus.DONE]: 'Done'
};
