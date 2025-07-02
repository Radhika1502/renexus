/**
 * Widget Configuration Panel Types
 * Type definitions for widget configuration components
 */

export interface WidgetConfig {
  id: string;
  title: string;
  type: WidgetType;
  size: WidgetSize;
  position?: {
    x: number;
    y: number;
  };
  refreshInterval?: number; // in seconds, undefined means no auto-refresh
  dataSource: WidgetDataSource;
  visualization: WidgetVisualization;
  filters?: WidgetFilter[];
  settings?: Record<string, any>;
  permissions?: {
    canView: string[]; // user IDs or roles
    canEdit: string[]; // user IDs or roles
  };
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WidgetType = 
  | 'chart' 
  | 'metric' 
  | 'table' 
  | 'list' 
  | 'timeline' 
  | 'map' 
  | 'custom';

export type WidgetSize = 
  | 'small' // 1x1
  | 'medium' // 2x1
  | 'large' // 2x2
  | 'wide' // 3x1
  | 'tall' // 1x2
  | 'full' // 3x2
  | 'custom'; // custom size

export interface WidgetDataSource {
  type: 'api' | 'query' | 'static' | 'function';
  source: string; // API endpoint, query ID, or function name
  parameters?: Record<string, any>;
  transformation?: string; // Optional transformation function name
}

export interface WidgetVisualization {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'table' | 'number' | 'text' | 'custom';
  subtype?: string; // e.g., 'stacked' for bar charts
  options?: Record<string, any>;
  colors?: string[];
  labels?: Record<string, string>;
}

export interface WidgetFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
  value: any;
  label?: string;
  editable?: boolean;
}

export interface WidgetConfigPanelProps {
  widget?: WidgetConfig;
  onSave: (config: WidgetConfig) => void;
  onCancel: () => void;
  availableDataSources: WidgetDataSourceOption[];
  isNew?: boolean;
  className?: string;
}

export interface WidgetDataSourceOption {
  id: string;
  name: string;
  type: 'api' | 'query' | 'static' | 'function';
  description?: string;
  parameters?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    required?: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  sampleData?: any;
}

export interface WidgetPreviewProps {
  config: WidgetConfig;
  className?: string;
}

export interface WidgetFormState {
  currentStep: number;
  config: WidgetConfig;
  errors: Record<string, string>;
  previewData: any;
  isLoading: boolean;
  isSaving: boolean;
}

export type WidgetFormAction = 
  | { type: 'SET_CONFIG'; payload: Partial<WidgetConfig> }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_PREVIEW_DATA'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean };
