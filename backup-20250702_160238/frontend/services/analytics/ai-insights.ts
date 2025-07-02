/**
 * AI Insights Service
 * Provides AI-powered analytics insights, recommendations, and optimizations
 * for Renexus analytics components
 */

import analyticsCacheService from './cache-service';

interface InsightRequest {
  dataType: 'performance' | 'tasks' | 'collaboration' | 'time' | 'workload';
  timeRange: 'day' | 'week' | 'month' | 'quarter' | 'year';
  filters?: Record<string, any>;
  userId?: string;
  teamId?: string;
  projectId?: string;
  limit?: number;
}

interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction' | 'correlation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  relatedMetrics: string[];
  timestamp: string;
  actions?: InsightAction[];
  metadata?: Record<string, any>;
}

interface InsightAction {
  label: string;
  type: 'link' | 'function' | 'filter';
  value: string;
  description?: string;
}

interface ForecastRequest {
  metricId: string;
  historicalData: Array<{ date: string; value: number }>;
  horizon: number; // Number of periods to forecast
  confidenceInterval?: boolean;
  seasonality?: 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  includeAnomalyDetection?: boolean;
}

interface ForecastResult {
  forecast: Array<{ date: string; value: number; upperBound?: number; lowerBound?: number }>;
  accuracy: {
    mape?: number; // Mean Absolute Percentage Error
    rmse?: number; // Root Mean Square Error
    r2?: number; // R-squared
  };
  anomalies?: Array<{ date: string; value: number; expected: number; deviation: number }>;
  trend?: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  seasonalityDetected?: boolean;
}

interface OptimizationRequest {
  type: 'workload' | 'schedule' | 'resources' | 'collaboration';
  constraints: Record<string, any>;
  objectives: Array<{ metric: string; direction: 'maximize' | 'minimize'; weight: number }>;
  currentState: Record<string, any>;
}

interface OptimizationResult {
  recommendations: Array<{
    action: string;
    impact: Record<string, number>;
    confidence: number;
    implementation: string;
  }>;
  expectedOutcomes: Record<string, number>;
  alternativeScenarios?: Array<{
    name: string;
    actions: string[];
    outcomes: Record<string, number>;
  }>;
}

interface ReportRecommendation {
  title: string;
  description: string;
  metrics: string[];
  visualizations: string[];
  filters: Record<string, any>;
  schedule?: string;
  recipients?: string[];
  priority: 'low' | 'medium' | 'high';
}

class AIInsightsService {
  private apiEndpoint: string;
  private apiKey: string | null = null;
  
  constructor() {
    this.apiEndpoint = process.env.AI_INSIGHTS_API_ENDPOINT || '/api/ai/insights';
  }
  
  /**
   * Set API key for external AI service if required
   * @param apiKey API key for authentication
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
  
  /**
   * Get AI-generated insights based on analytics data
   * @param request Insight request parameters
   * @returns Array of insights
   */
  public async getInsights(request: InsightRequest): Promise<Insight[]> {
    try {
      // Check cache first
      const cacheKey = `insights:${JSON.stringify(request)}`;
      const cachedInsights = analyticsCacheService.get<Insight[]>('aiInsights', cacheKey);
      
      if (cachedInsights) {
        console.log('Retrieved insights from cache');
        return cachedInsights;
      }
      
      // Make API request to AI service
      const response = await this.makeApiRequest('/insights', request);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get insights');
      }
      
      // Cache the results
      analyticsCacheService.set('aiInsights', cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error getting AI insights:', error);
      return this.getFallbackInsights(request);
    }
  }
  
  /**
   * Generate time series forecasts using AI models
   * @param request Forecast request parameters
   * @returns Forecast results
   */
  public async generateForecast(request: ForecastRequest): Promise<ForecastResult> {
    try {
      // Check cache first
      const cacheKey = `forecast:${request.metricId}:${request.horizon}:${request.seasonality || 'none'}`;
      const cachedForecast = analyticsCacheService.get<ForecastResult>('aiForecasts', cacheKey);
      
      if (cachedForecast) {
        console.log('Retrieved forecast from cache');
        return cachedForecast;
      }
      
      // Make API request to AI service
      const response = await this.makeApiRequest('/forecast', request);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate forecast');
      }
      
      // Cache the results
      analyticsCacheService.set('aiForecasts', cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error generating forecast:', error);
      return this.getFallbackForecast(request);
    }
  }
  
  /**
   * Get AI-powered optimization recommendations
   * @param request Optimization request parameters
   * @returns Optimization results
   */
  public async getOptimizationRecommendations(request: OptimizationRequest): Promise<OptimizationResult> {
    try {
      // Check cache first
      const cacheKey = `optimization:${request.type}:${JSON.stringify(request.objectives)}`;
      const cachedOptimization = analyticsCacheService.get<OptimizationResult>('aiOptimizations', cacheKey);
      
      if (cachedOptimization) {
        console.log('Retrieved optimization from cache');
        return cachedOptimization;
      }
      
      // Make API request to AI service
      const response = await this.makeApiRequest('/optimize', request);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get optimization recommendations');
      }
      
      // Cache the results
      analyticsCacheService.set('aiOptimizations', cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error getting optimization recommendations:', error);
      return this.getFallbackOptimization(request);
    }
  }
  
  /**
   * Get AI-recommended report configurations based on user role and data
   * @param userId User ID
   * @param teamId Optional team ID
   * @param projectId Optional project ID
   * @returns Array of report recommendations
   */
  public async getReportRecommendations(
    userId: string,
    teamId?: string,
    projectId?: string
  ): Promise<ReportRecommendation[]> {
    try {
      // Check cache first
      const cacheKey = `reportRecs:${userId}:${teamId || 'all'}:${projectId || 'all'}`;
      const cachedRecommendations = analyticsCacheService.get<ReportRecommendation[]>('aiReportRecs', cacheKey);
      
      if (cachedRecommendations) {
        console.log('Retrieved report recommendations from cache');
        return cachedRecommendations;
      }
      
      // Make API request to AI service
      const response = await this.makeApiRequest('/report-recommendations', {
        userId,
        teamId,
        projectId
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get report recommendations');
      }
      
      // Cache the results
      analyticsCacheService.set('aiReportRecs', cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error getting report recommendations:', error);
      return this.getFallbackReportRecommendations(userId, teamId, projectId);
    }
  }
  
  /**
   * Analyze text input for natural language querying of analytics data
   * @param query Natural language query
   * @param context Optional context information
   * @returns Query results and visualization suggestions
   */
  public async analyzeNaturalLanguageQuery(
    query: string,
    context?: Record<string, any>
  ): Promise<{
    interpretedQuery: Record<string, any>;
    results: any;
    suggestedVisualizations: Array<{
      type: string;
      title: string;
      description: string;
      config: Record<string, any>;
    }>;
  }> {
    try {
      // Make API request to AI service
      const response = await this.makeApiRequest('/natural-language', {
        query,
        context
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to analyze natural language query');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing natural language query:', error);
      return {
        interpretedQuery: { error: 'Failed to interpret query' },
        results: [],
        suggestedVisualizations: []
      };
    }
  }
  
  /**
   * Make API request to AI service
   * @param endpoint API endpoint
   * @param data Request data
   * @returns API response
   */
  private async makeApiRequest(endpoint: string, data: any): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(`${this.apiEndpoint}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error(`API request to ${endpoint} failed:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Generate fallback insights when API request fails
   * @param request Insight request parameters
   * @returns Array of fallback insights
   */
  private getFallbackInsights(request: InsightRequest): Insight[] {
    console.log('Generating fallback insights for', request.dataType);
    
    const now = new Date().toISOString();
    
    // Generate basic fallback insights based on request type
    switch (request.dataType) {
      case 'performance':
        return [
          {
            id: 'fallback-perf-1',
            type: 'recommendation',
            title: 'Consider reviewing team performance metrics',
            description: 'Regular review of performance metrics can help identify trends and areas for improvement.',
            priority: 'medium',
            confidence: 0.7,
            relatedMetrics: ['completion_rate', 'on_time_delivery'],
            timestamp: now
          },
          {
            id: 'fallback-perf-2',
            type: 'trend',
            title: 'Performance data available for analysis',
            description: 'Performance data is available for the selected time period. Try adjusting filters for more specific insights.',
            priority: 'low',
            confidence: 0.9,
            relatedMetrics: ['productivity', 'quality'],
            timestamp: now
          }
        ];
        
      case 'tasks':
        return [
          {
            id: 'fallback-task-1',
            type: 'recommendation',
            title: 'Task distribution may need balancing',
            description: 'Consider reviewing task assignments to ensure balanced workload across team members.',
            priority: 'medium',
            confidence: 0.6,
            relatedMetrics: ['task_completion', 'workload_balance'],
            timestamp: now
          }
        ];
        
      case 'collaboration':
        return [
          {
            id: 'fallback-collab-1',
            type: 'insight',
            title: 'Collaboration patterns detected',
            description: 'Review the collaboration network visualization to identify key team connections and potential silos.',
            priority: 'medium',
            confidence: 0.8,
            relatedMetrics: ['collaboration_frequency', 'cross_team_interaction'],
            timestamp: now
          }
        ];
        
      default:
        return [
          {
            id: 'fallback-general-1',
            type: 'recommendation',
            title: 'Analytics data ready for exploration',
            description: 'Use the available filters and visualization options to explore patterns in your data.',
            priority: 'low',
            confidence: 0.9,
            relatedMetrics: ['general'],
            timestamp: now
          }
        ];
    }
  }
  
  /**
   * Generate fallback forecast when API request fails
   * @param request Forecast request parameters
   * @returns Fallback forecast result
   */
  private getFallbackForecast(request: ForecastRequest): ForecastResult {
    console.log('Generating fallback forecast for', request.metricId);
    
    // Use simple moving average for fallback forecast
    const historicalData = request.historicalData;
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    const forecast = [];
    
    // Calculate average of last 3 points or all points if less than 3
    const sampleSize = Math.min(3, historicalData.length);
    const lastValues = historicalData.slice(-sampleSize).map(item => item.value);
    const avgValue = lastValues.reduce((sum, val) => sum + val, 0) / sampleSize;
    
    // Generate forecast points
    for (let i = 1; i <= request.horizon; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        value: avgValue,
        upperBound: request.confidenceInterval ? avgValue * 1.1 : undefined,
        lowerBound: request.confidenceInterval ? avgValue * 0.9 : undefined
      });
    }
    
    return {
      forecast,
      accuracy: {
        mape: 0.2, // Placeholder accuracy metrics
        rmse: 0.5,
        r2: 0.7
      },
      trend: 'stable'
    };
  }
  
  /**
   * Generate fallback optimization recommendations when API request fails
   * @param request Optimization request parameters
   * @returns Fallback optimization result
   */
  private getFallbackOptimization(request: OptimizationRequest): OptimizationResult {
    console.log('Generating fallback optimization for', request.type);
    
    // Generate basic fallback recommendations based on optimization type
    switch (request.type) {
      case 'workload':
        return {
          recommendations: [
            {
              action: 'Consider redistributing tasks among team members',
              impact: { 'team_balance': 0.2, 'productivity': 0.1 },
              confidence: 0.7,
              implementation: 'Review current task assignments and identify opportunities to balance workload.'
            }
          ],
          expectedOutcomes: {
            'team_balance': 0.8,
            'productivity': 0.75,
            'satisfaction': 0.6
          }
        };
        
      case 'schedule':
        return {
          recommendations: [
            {
              action: 'Adjust project timeline to accommodate resource constraints',
              impact: { 'on_time_delivery': 0.15, 'quality': 0.1 },
              confidence: 0.6,
              implementation: 'Review critical path and consider adjusting non-critical task deadlines.'
            }
          ],
          expectedOutcomes: {
            'on_time_delivery': 0.85,
            'quality': 0.8,
            'resource_utilization': 0.7
          }
        };
        
      default:
        return {
          recommendations: [
            {
              action: 'Review current processes for optimization opportunities',
              impact: { 'efficiency': 0.1 },
              confidence: 0.5,
              implementation: 'Conduct a process review workshop with key stakeholders.'
            }
          ],
          expectedOutcomes: {
            'efficiency': 0.7
          }
        };
    }
  }
  
  /**
   * Generate fallback report recommendations when API request fails
   * @param userId User ID
   * @param teamId Optional team ID
   * @param projectId Optional project ID
   * @returns Array of fallback report recommendations
   */
  private getFallbackReportRecommendations(
    userId: string,
    teamId?: string,
    projectId?: string
  ): ReportRecommendation[] {
    console.log('Generating fallback report recommendations for user', userId);
    
    return [
      {
        title: 'Team Performance Summary',
        description: 'Weekly summary of key performance metrics for your team',
        metrics: ['completion_rate', 'on_time_delivery', 'quality_score'],
        visualizations: ['line_chart', 'bar_chart'],
        filters: { timeRange: 'week' },
        schedule: 'weekly',
        priority: 'high'
      },
      {
        title: 'Resource Utilization Report',
        description: 'Overview of resource allocation and utilization',
        metrics: ['utilization_rate', 'capacity', 'availability'],
        visualizations: ['heat_map', 'pie_chart'],
        filters: { groupBy: 'team' },
        priority: 'medium'
      },
      {
        title: 'Task Completion Trends',
        description: 'Analysis of task completion patterns over time',
        metrics: ['tasks_completed', 'average_completion_time', 'backlog_growth'],
        visualizations: ['area_chart', 'scatter_plot'],
        filters: { status: 'completed' },
        priority: 'medium'
      }
    ];
  }
}

// Initialize cache namespaces for AI insights
analyticsCacheService.initializeCache('aiInsights', {
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 100,
  invalidationStrategy: 'lru'
});

analyticsCacheService.initializeCache('aiForecasts', {
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 50,
  invalidationStrategy: 'lru'
});

analyticsCacheService.initializeCache('aiOptimizations', {
  ttl: 2 * 60 * 60 * 1000, // 2 hours
  maxSize: 30,
  invalidationStrategy: 'lru'
});

analyticsCacheService.initializeCache('aiReportRecs', {
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 50,
  invalidationStrategy: 'lru'
});

// Create singleton instance
const aiInsightsService = new AIInsightsService();

export default aiInsightsService;
