/**
 * AI Types for Renexus
 * These types define the structure for AI-powered features
 */

// Task Suggestion Types
export interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number; // in minutes
  suggestedDueDate: string;
  confidence: number; // 0-1
  tags: string[];
  relatedTasks?: string[]; // IDs of related tasks
  aiReasoning: string; // Explanation of why this task was suggested
  createdAt: string;
}

// Workflow Automation Types
export interface WorkflowRule {
  id: string;
  projectId: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: string;
  conditions: Record<string, any>;
}

export interface WorkflowAction {
  type: string;
  parameters: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  projectId: string;
  triggeredBy: {
    type: string;
    taskId?: string;
    projectId?: string;
    userId?: string;
    [key: string]: any;
  };
  actions: {
    type: string;
    status: 'pending' | 'success' | 'failed';
    details: string;
  }[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  executedAt: Date;
}

// AI Analytics Types
export interface PredictiveAnalysis {
  projectId: string;
  predictedCompletionDate: Date;
  confidenceLevel: number;
  riskFactors: {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    description: string;
  }[];
  taskPredictions: {
    taskId: string;
    predictedCompletion: Date;
    confidence: number;
    potentialBlockers: string[];
  }[];
  resourceRecommendations: {
    recommendation: string;
    impact: string;
    confidence: number;
  }[];
}

export interface TrendData {
  id: string;
  entityId: string;
  entityType: 'project' | 'team' | 'user';
  trendType: string;
  description: string;
  significance: 'low' | 'medium' | 'high';
  data: {
    dataPoints: { date: string; value: number }[];
    unit: string;
  };
  insights: string[];
}

export interface AnomalyDetection {
  id: string;
  projectId: string;
  metricType: string;
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
  data: {
    expected: number;
    actual: number;
    deviation: number;
    timeperiod: string;
  };
  possibleCauses: string[];
  recommendations: string[];
}

// NLP Types
export interface NLPAnalysisResult {
  entities: EntityExtraction;
  intent: IntentRecognition;
  sentiment: SentimentAnalysis;
  summary: string;
  suggestedActions: {
    type: string;
    confidence: number;
    parameters: Record<string, any>;
  }[];
}

export interface EntityExtraction {
  tasks: {
    name: string;
    confidence: number;
  }[];
  dates: {
    text: string;
    parsedDate: Date;
    type: string;
    confidence: number;
  }[];
  people: {
    name: string;
    role: string;
    confidence: number;
  }[];
  priorities: {
    level: string;
    confidence: number;
  }[];
  labels: {
    name: string;
    confidence: number;
  }[];
}

export interface IntentRecognition {
  primaryIntent: {
    type: string;
    confidence: number;
  };
  secondaryIntents: {
    type: string;
    confidence: number;
  }[];
  parameters: Record<string, any>;
}

export interface SentimentAnalysis {
  overall: {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
  };
  aspects: {
    aspect: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
  }[];
}

// Analytics & Reporting Types
export interface TaskAnalytics {
  projectId: string;
  timeframe: string;
  completionMetrics: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    completionRate: number;
  };
  timeTracking: {
    totalHours: number;
    averageTaskTime: number;
    taskTimeDistribution: {
      category: string;
      hours: number;
    }[];
  };
  distribution: {
    byStatus: {
      status: string;
      count: number;
    }[];
    byAssignee: {
      assigneeId: string;
      assigneeName: string;
      count: number;
    }[];
    byPriority: {
      priority: string;
      count: number;
    }[];
  };
  trends: {
    period: string;
    completedTasks: number;
    createdTasks: number;
  }[];
}

export interface TeamPerformance {
  teamId: string;
  timeframe: string;
  productivityMetrics: {
    tasksCompleted: number;
    averageCompletionTime: number;
    velocityTrend: {
      period: string;
      velocity: number;
    }[];
  };
  workloadDistribution: {
    memberId: string;
    memberName: string;
    assignedTasks: number;
    completedTasks: number;
    utilization: number;
  }[];
  collaborationMetrics: {
    commentCount: number;
    reviewCount: number;
    collaborationScore: number;
    collaborationNetwork: {
      source: string;
      target: string;
      strength: number;
    }[];
  };
  performanceTrends: {
    period: string;
    metric: string;
    value: number;
  }[];
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metrics: {
    name: string;
    type: string;
    source: string;
    parameters: Record<string, any>;
  }[];
  filters: {
    field: string;
    operator: string;
    value: any;
  }[];
  groupBy?: string[];
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  visualization: {
    type: string;
    options: Record<string, any>;
  };
}

export interface VisualizationData {
  id: string;
  type: string;
  title: string;
  description?: string;
  data: any[];
  config: any;
  createdAt: Date;
}

export interface DataVisualization {
  id: string;
  type: 'chart' | 'graph' | 'table' | 'metric';
  title: string;
  description?: string;
  data: any;
  options: Record<string, any>;
  dimensions: {
    width: number;
    height: number;
  };
  position?: {
    x: number;
    y: number;
  };
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  visualization: DataVisualization;
  refreshInterval?: number;
  lastUpdated: Date;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AIAnalysis {
  taskId: string;
  insights: {
    timeEstimateAccuracy: number; // 0-1
    complexityScore: number; // 0-1
    riskLevel: 'low' | 'medium' | 'high';
    bottlenecks: string[];
    recommendations: string[];
  };
  performanceMetrics: {
    completionRate: number; // 0-1
    onTimeDelivery: number; // 0-1
    qualityScore: number; // 0-1
  };
  createdAt: string;
}

export interface AIRecommendation {
  id: string;
  type: 'workflow' | 'resource' | 'scheduling' | 'risk';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  benefits: string[];
  risks: string[];
  implementationSteps: string[];
  createdAt: string;
}
