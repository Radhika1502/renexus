/**
 * Widget Configuration Types
 * Defines the type system for dashboard widgets and their configuration
 */

export type VisualizationType = 
  | 'bar' 
  | 'line' 
  | 'pie' 
  | 'area' 
  | 'scatter' 
  | 'gauge' 
  | 'table' 
  | 'kanban' 
  | 'calendar' 
  | 'heatmap';

export type DataAggregation = 
  | 'sum' 
  | 'average' 
  | 'count' 
  | 'min' 
  | 'max' 
  | 'median' 
  | 'percentile' 
  | 'unique';

export type TimeGranularity = 
  | 'hour' 
  | 'day' 
  | 'week' 
  | 'month' 
  | 'quarter' 
  | 'year';

export type FilterOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'notContains' 
  | 'greaterThan' 
  | 'lessThan' 
  | 'between' 
  | 'in' 
  | 'notIn' 
  | 'exists' 
  | 'notExists';

export interface DataField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  path: string;
  description?: string;
  format?: string;
  aggregatable?: boolean;
  filterable?: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'database' | 'file' | 'service';
  endpoint?: string;
  refreshInterval?: number; // in seconds
  fields: DataField[];
  parameters?: Record<string, any>;
  authentication?: {
    type: 'none' | 'apiKey' | 'oauth' | 'basic';
    config?: Record<string, any>;
  };
}

export interface FilterConfig {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  conjunction?: 'and' | 'or';
}

export interface VisualizationConfig {
  type: VisualizationType;
  title: string;
  subtitle?: string;
  xAxis?: {
    field: string;
    label?: string;
    showGrid?: boolean;
    showLabels?: boolean;
    format?: string;
  };
  yAxis?: {
    field: string;
    label?: string;
    showGrid?: boolean;
    showLabels?: boolean;
    format?: string;
  };
  series?: Array<{
    name: string;
    field: string;
    aggregation?: DataAggregation;
    color?: string;
  }>;
  legend?: {
    show: boolean;
    position: 'top' | 'right' | 'bottom' | 'left';
  };
  colors?: string[];
  timeGranularity?: TimeGranularity;
  showDataLabels?: boolean;
  stacked?: boolean;
  aspectRatio?: number;
  tableColumns?: Array<{
    field: string;
    header: string;
    width?: number;
    sortable?: boolean;
    format?: string;
  }>;
}

export interface WidgetConfig {
  id: string;
  name: string;
  description?: string;
  dataSourceId: string;
  filters: FilterConfig[];
  visualization: VisualizationConfig;
  refreshInterval?: number; // in seconds
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  permissions?: {
    view: string[];
    edit: string[];
  };
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  config: Partial<WidgetConfig>;
  tags?: string[];
}
