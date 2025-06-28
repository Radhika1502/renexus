import { TaskPriority, TaskStatus } from './index';

/**
 * Types of bulk operations that can be performed on tasks
 */
export type BulkOperationType = 
  | 'update-status'
  | 'update-priority'
  | 'update-assignee'
  | 'update-dueDate'
  | 'add-label'
  | 'remove-label'
  | 'delete'
  | 'archive'
  | 'move-project';

/**
 * Interface for bulk operation payload
 */
export interface BulkOperationPayload {
  taskIds: string[];
  operation: BulkOperationType;
  data?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
    label?: string;
    projectId?: string;
  };
}

/**
 * Interface for bulk operation result
 */
export interface BulkOperationResult {
  successful: number;
  failed: number;
  failedTaskIds?: string[];
  errors?: Record<string, string>;
}

/**
 * Interface for bulk selection state
 */
export interface BulkSelectionState {
  selectedTaskIds: string[];
  isSelectMode: boolean;
}

/**
 * Interface for bulk action option
 */
export interface BulkActionOption {
  id: BulkOperationType;
  label: string;
  icon: React.ReactNode;
  requiresData?: boolean;
  dataComponent?: React.ComponentType<{
    onDataSelect: (data: any) => void;
    onCancel: () => void;
  }>;
  confirmationMessage?: string;
  isDangerous?: boolean;
}
