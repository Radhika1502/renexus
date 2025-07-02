import { ReactNode } from 'react';

export type BulkOperationType = 
  | 'update-status'
  | 'update-priority'
  | 'update-assignee'
  | 'update-dueDate'
  | 'add-label'
  | 'remove-label'
  | 'move-project'
  | 'archive'
  | 'delete'
  | 'duplicate'
  | 'export'
  | 'apply-workflow'
  | 'schedule';

export interface BulkActionOption {
  id: BulkOperationType;
  label: string;
  icon: ReactNode;
  requiresData?: boolean;
  dataComponent?: React.FC<{
    onDataSelect: (data: any) => void;
    onCancel: () => void;
  }>;
  confirmationMessage?: string;
  isDangerous?: boolean;
}

export interface BulkOperationPayload {
  taskIds: string[];
  operation: BulkOperationType;
  data?: any;
}

export interface BulkOperationResult {
  success: boolean;
  operation: string;
  affectedCount: number;
  errors?: string[];
}
