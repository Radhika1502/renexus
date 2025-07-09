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

// Analytics Types for Task Management
export interface TaskAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  assignees?: string[];
  statuses?: string[];
  priorities?: string[];
  categories?: string[];
  tags?: string[];
  projectId?: string;
}

export interface TaskMetrics {
  id: string;
  taskId: string;
  taskName: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  assignee: string;
  assigneeId: string;
  createdDate: string;
  dueDate: string;
  completedDate: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completionTime: number | null; // in hours
  tags: string[];
  category: string;
  mentions: UserMention[];
}

export interface UserMention {
  id: string;
  userId: string;
  userName: string;
  taskId: string;
  taskTitle: string;
  mentionedAt: string;
  context: string;
}

export interface TaskAnalyticsResponse {
  tasks: TaskMetrics[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;
    completionRate: number;
  };
  trends: TaskTrend[];
  filters: TaskAnalyticsFilters;
}

export interface TaskTrend {
  date: string;
  completed: number;
  created: number;
  inProgress: number;
}

export interface UserMentionsResponse {
  mentions: UserMention[];
  summary: {
    totalMentions: number;
    uniqueTasks: number;
    averagePerDay: number;
  };
  timeframe: string;
}

export interface PerformanceMetrics {
  productivity: {
    tasksCompletedPerDay: number;
    averageTaskDuration: number;
    velocityTrend: number[];
  };
  quality: {
    defectRate: number;
    reworkRate: number;
    customerSatisfaction: number;
  };
  collaboration: {
    mentionsReceived: number;
    mentionsGiven: number;
    collaborationScore: number;
  };
}

export interface CompletionTrends {
  daily: TaskTrend[];
  weekly: TaskTrend[];
  monthly: TaskTrend[];
  projectBreakdown: {
    projectId: string;
    projectName: string;
    completionRate: number;
    totalTasks: number;
  }[];
}
