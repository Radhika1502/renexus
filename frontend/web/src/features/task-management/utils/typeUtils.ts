import { Task } from '../types';

// Define TimeLogEntry interface and export it
export interface TimeLogEntry {
  hours: number;
  description: string;
  date: string;
  userId: string;
}

/**
 * Type assertion helper for Task with TimeLog
 * This ensures TypeScript recognizes the timeLog property on Task objects
 */
export interface TaskWithTimeLog extends Task {
  timeLog: TimeLogEntry[];
}

/**
 * Helper function to assert a Task as TaskWithTimeLog
 * @param task The task to assert
 * @returns The same task but with timeLog property properly typed
 */
export function assertTaskWithTimeLog(task: Task): TaskWithTimeLog {
  return task as TaskWithTimeLog;
}
