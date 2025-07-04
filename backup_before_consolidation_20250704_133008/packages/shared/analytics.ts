/**
 * Analytics related types for the Renexus application
 */

export interface TimeRange {
  startDate: string;
  endDate: string;
}

export interface DataPoint {
  label: string;
  value: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface TaskCompletionTrend {
  date: string;
  completed: number;
  created: number;
  cumulative: number;
}

export interface UserProductivity {
  userId: string;
  userName: string;
  tasksCompleted: number;
  averageCompletionTime: number; // in hours
  onTimePercentage: number;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  completedTasks: number;
  totalTasks: number;
  completionPercentage: number;
  onSchedule: boolean;
  predictedEndDate: string;
}

export interface ResourceUtilization {
  userId: string;
  userName: string;
  allocatedHours: number;
  actualHours: number;
  utilizationPercentage: number;
  overallocated: boolean;
}

export interface PredictiveMetric {
  metric: string;
  currentValue: number;
  predictedValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number; // 0-1
}

export interface CustomFormula {
  id: string;
  name: string;
  formula: string;
  description: string;
  variables: {
    name: string;
    path: string;
  }[];
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  isShared: boolean;
  sharedWith?: string[];
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list';
  title: string;
  dataSource: string;
  config: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description?: string;
  sections: ReportSection[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    day?: number; // day of week (0-6) or day of month (1-31)
    time: string; // HH:MM format
    recipients: string[]; // email addresses
  };
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  charts?: {
    id: string;
    type: string;
    data: any;
    config: any;
  }[];
  tables?: {
    id: string;
    headers: string[];
    rows: any[][];
  }[];
}

export interface AnalyticsFilter {
  timeRange?: TimeRange;
  projects?: string[];
  users?: string[];
  taskStatus?: string[];
  taskPriority?: string[];
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface AnomalyDetection {
  id: string;
  metric: string;
  timestamp: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

export interface ForecastResult {
  metric: string;
  currentValue: number;
  forecastValues: {
    date: string;
    value: number;
    lowerBound: number;
    upperBound: number;
  }[];
  confidence: number;
}
