import { TaskFilters } from './index';

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  filters: TaskFilters;
  isDefault?: boolean;
  isGlobal?: boolean;
  projectId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  icon?: string;
}

export interface SavedViewInput {
  name: string;
  description?: string;
  filters: TaskFilters;
  isGlobal?: boolean;
  projectId?: string;
  icon?: string;
}

export interface SavedViewUpdateInput extends Partial<SavedViewInput> {
  id: string;
}

export interface SavedViewsState {
  views: SavedView[];
  currentViewId?: string;
  isLoading: boolean;
  error?: string;
}

export interface AdvancedFilterOptions extends TaskFilters {
  search?: string;
  createdDateRange?: {
    start?: string;
    end?: string;
  };
  updatedDateRange?: {
    start?: string;
    end?: string;
  };
  dueDateRange?: {
    start?: string;
    end?: string;
  };
  completedDateRange?: {
    start?: string;
    end?: string;
  };
  customFields?: {
    [key: string]: string | number | boolean | string[];
  };
  hasAttachments?: boolean;
  hasComments?: boolean;
  hasSubtasks?: boolean;
  subtaskStatus?: string[];
  createdBy?: string[];
  watchedBy?: string[];
  timeTracked?: {
    min?: number;
    max?: number;
  };
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  groupBy?: string;
}
