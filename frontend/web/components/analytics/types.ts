export interface WidgetConfig {
  id: string;
  title: string;
  type: string;
  dataSource: string;
  options?: Record<string, any>;
  width: number;
  height: number;
  x: number;
  y: number;
  refreshInterval?: number; // in seconds
}

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
} 