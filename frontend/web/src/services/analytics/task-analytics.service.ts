import { TaskAnalyticsFilters, TaskAnalyticsResponse, UserMentionsResponse } from '../../types/analytics';

/**
 * Task Analytics Service
 * 
 * Handles fetching and processing task analytics data
 */
export class TaskAnalyticsService {
  private readonly apiBaseUrl: string;
  private readonly cache: Map<string, any>;
  private readonly cacheTimeout: number = 5 * 60 * 1000; // 5 minutes
  
  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.cache = new Map();
  }

  /**
   * Get task analytics data with optional filters
   */
  public async getTaskAnalytics(filters?: TaskAnalyticsFilters): Promise<TaskAnalyticsResponse> {
    const cacheKey = this.generateCacheKey('taskAnalytics', filters);
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData as TaskAnalyticsResponse;
    }
    
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await fetch(`${this.apiBaseUrl}/analytics/tasks${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch task analytics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      this.addToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching task analytics:', error);
      throw new Error('Failed to fetch task analytics data. Please check your connection and try again.');
    }
  }

  /**
   * Get user mentions analytics
   */
  public async getUserMentions(userId: string, timeframe: string = '30d'): Promise<UserMentionsResponse> {
    const cacheKey = this.generateCacheKey('userMentions', { userId, timeframe });
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData as UserMentionsResponse;
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/analytics/users/${userId}/mentions?timeframe=${timeframe}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user mentions: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      this.addToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching user mentions:', error);
      throw new Error('Failed to fetch user mentions data. Please check your connection and try again.');
    }
  }

  /**
   * Get task completion trends
   */
  public async getCompletionTrends(projectId?: string, timeRange?: string): Promise<any> {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (timeRange) params.append('timeRange', timeRange);
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/analytics/tasks/completion-trends?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch completion trends: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching completion trends:', error);
      throw new Error('Failed to fetch completion trends. Please check your connection and try again.');
    }
  }

  /**
   * Get performance metrics
   */
  public async getPerformanceMetrics(filters?: any): Promise<any> {
    try {
      const queryParams = this.buildQueryParams(filters);
      const response = await fetch(`${this.apiBaseUrl}/analytics/performance${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance metrics: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Failed to fetch performance metrics. Please check your connection and try again.');
    }
  }

  /**
   * Generate cache key from method name and parameters
   */
  private generateCacheKey(method: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${method}_${paramsStr}`;
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
      this.cache.delete(key);
      return null;
  }

  /**
   * Add data to cache with timestamp
   */
  private addToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Build query parameters string from filters object
   */
  private buildQueryParams(filters?: any): string {
    if (!filters) return '';
    
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });
    
    return params.toString() ? `?${params.toString()}` : '';
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string {
    // In a real implementation, get token from secure storage
    return localStorage.getItem('authToken') || '';
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const taskAnalyticsService = new TaskAnalyticsService();

