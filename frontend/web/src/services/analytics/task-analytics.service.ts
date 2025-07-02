import { TaskMetrics, 
  TaskAnalyticsFilters, 
  TaskAnalyticsResponse, 
  UserMention 
 } from "../../../shared/types/task-analytics";

/**
 * Task Analytics Service
 * 
 * Handles fetching and processing task analytics data
 */
export class TaskAnalyticsService {
  private static instance: TaskAnalyticsService;
  private apiBaseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  private constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '/api';
    this.cache = new Map();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TaskAnalyticsService {
    if (!TaskAnalyticsService.instance) {
      TaskAnalyticsService.instance = new TaskAnalyticsService();
    }
    return TaskAnalyticsService.instance;
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
      const response = await fetch(`${this.apiBaseUrl}/analytics/tasks${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch task analytics: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.addToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching task analytics:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  /**
   * Get user mentions data
   */
  public async getUserMentions(userId: string): Promise<UserMention[]> {
    const cacheKey = this.generateCacheKey('userMentions', { userId });
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData as UserMention[];
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/analytics/mentions/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user mentions: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.addToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching user mentions:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  /**
   * Mark a user mention as resolved
   */
  public async resolveUserMention(mentionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/analytics/mentions/${mentionId}/resolve`, {
        method: 'PUT'
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error resolving user mention:', error);
      return false;
    }
  }

  /**
   * Clear cache for task analytics
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate a cache key based on the endpoint and parameters
   */
  private generateCacheKey(endpoint: string, params?: any): string {
    if (!params) {
      return endpoint;
    }
    
    return `${endpoint}-${JSON.stringify(params)}`;
  }

  /**
   * Get data from cache if it's still valid
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Add data to cache
   */
  private addToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Build query parameters string from filters
   */
  private buildQueryParams(filters?: TaskAnalyticsFilters): string {
    if (!filters) {
      return '';
    }
    
    const params = new URLSearchParams();
    
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    
    if (filters.assignees && filters.assignees.length > 0) {
      params.append('assignees', filters.assignees.join(','));
    }
    
    if (filters.statuses && filters.statuses.length > 0) {
      params.append('statuses', filters.statuses.join(','));
    }
    
    if (filters.priorities && filters.priorities.length > 0) {
      params.append('priorities', filters.priorities.join(','));
    }
    
    if (filters.categories && filters.categories.length > 0) {
      params.append('categories', filters.categories.join(','));
    }
    
    if (filters.tags && filters.tags.length > 0) {
      params.append('tags', filters.tags.join(','));
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Generate mock task analytics data for development
   */
  private getMockTaskAnalytics(filters?: TaskAnalyticsFilters): TaskAnalyticsResponse {
    // Create mock tasks
    const tasks: TaskMetrics[] = [];
    const statuses: Array<TaskMetrics['status']> = ['todo', 'in_progress', 'review', 'done', 'blocked'];
    const priorities: Array<TaskMetrics['priority']> = ['low', 'medium', 'high', 'urgent'];
    const categories = ['Frontend', 'Backend', 'Design', 'Documentation', 'Testing'];
    const assignees = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams'];
    
    for (let i = 1; i <= 50; i++) {
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const completedDate = status === 'done' 
        ? new Date(createdDate.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) 
        : null;
      
      const dueDate = new Date(createdDate.getTime() + Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000));
      
      const assignee = assignees[Math.floor(Math.random() * assignees.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      tasks.push({
        id: `task-metric-${i}`,
        taskId: `task-${i}`,
        taskName: `Task ${i}`,
        status,
        assignee,
        assigneeId: assignee.toLowerCase().replace(' ', '-'),
        createdDate: createdDate.toISOString(),
        dueDate: dueDate.toISOString(),
        completedDate: completedDate?.toISOString() || null,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        completionTime: completedDate ? Math.floor(Math.random() * 40) + 1 : null,
        tags: ['tag1', 'tag2'].slice(0, Math.floor(Math.random() * 3)),
        category,
        mentions: []
      });
    }
    
    // Apply filters if provided
    let filteredTasks = [...tasks];
    
    if (filters) {
      if (filters.startDate) {
        filteredTasks = filteredTasks.filter(task => 
          new Date(task.createdDate) >= new Date(filters.startDate!)
        );
      }
      
      if (filters.endDate) {
        filteredTasks = filteredTasks.filter(task => 
          new Date(task.createdDate) <= new Date(filters.endDate!)
        );
      }
      
      if (filters.assignees && filters.assignees.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.assignees!.includes(task.assigneeId)
        );
      }
      
      if (filters.statuses && filters.statuses.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.statuses!.includes(task.status)
        );
      }
      
      if (filters.priorities && filters.priorities.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.priorities!.includes(task.priority)
        );
      }
      
      if (filters.categories && filters.categories.length > 0) {
        filteredTasks = filteredTasks.filter(task => 
          filters.categories!.includes(task.category)
        );
      }
    }
    
    // Calculate summary
    const completedTasks = filteredTasks.filter(task => task.status === 'done');
    const pendingTasks = filteredTasks.filter(task => task.status !== 'done');
    const overdueTasks = filteredTasks.filter(task => 
      task.status !== 'done' && 
      task.dueDate && 
      new Date(task.dueDate) < new Date()
    );
    
    const totalCompletionTime = completedTasks.reduce((sum, task) => 
      sum + (task.completionTime || 0), 0
    );
    
    const averageCompletionTime = completedTasks.length > 0 
      ? totalCompletionTime / completedTasks.length 
      : 0;
    
    // Calculate tasks by status
    const tasksByStatus: Record<string, number> = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
      blocked: 0
    };
    
    filteredTasks.forEach(task => {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
    });
    
    // Calculate tasks by priority
    const tasksByPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };
    
    filteredTasks.forEach(task => {
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    });
    
    // Calculate tasks by assignee
    const tasksByAssignee: Record<string, number> = {};
    
    filteredTasks.forEach(task => {
      tasksByAssignee[task.assignee] = (tasksByAssignee[task.assignee] || 0) + 1;
    });
    
    // Calculate tasks by category
    const tasksByCategory: Record<string, number> = {};
    
    filteredTasks.forEach(task => {
      tasksByCategory[task.category] = (tasksByCategory[task.category] || 0) + 1;
    });
    
    // Generate trend data for the last 14 days
    const trends: TaskTrend[] = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const created = Math.floor(Math.random() * 5);
      const completed = Math.floor(Math.random() * 5);
      const active = 10 + Math.floor(Math.random() * 20);
      
      trends.push({
        date: dateString,
        created,
        completed,
        active
      });
    }
    
    return {
      summary: {
        totalTasks: filteredTasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        overdueTasks: overdueTasks.length,
        averageCompletionTime,
        tasksByStatus: tasksByStatus as Record<TaskMetrics['status'], number>,
        tasksByPriority: tasksByPriority as Record<TaskMetrics['priority'], number>,
        tasksByAssignee,
        tasksByCategory
      },
      tasks: filteredTasks,
      trends
    };
  }

  /**
   * Generate mock user mentions data for development
   */
  private getMockUserMentions(userId: string): UserMention[] {
    const mentions: UserMention[] = [];
    const users = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams'];
    const userIds = users.map(name => name.toLowerCase().replace(' ', '-'));
    
    // Only generate mentions if the userId is in our mock users
    if (!userIds.includes(userId)) {
      return [];
    }
    
    const username = users[userIds.indexOf(userId)];
    
    for (let i = 1; i <= 5; i++) {
      const mentionedAt = new Date();
      mentionedAt.setDate(mentionedAt.getDate() - Math.floor(Math.random() * 7));
      
      const resolved = Math.random() > 0.5;
      const resolvedAt = resolved 
        ? new Date(mentionedAt.getTime() + Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000)).toISOString() 
        : undefined;
      
      const mentionedBy = users.filter(user => user !== username)[Math.floor(Math.random() * (users.length - 1))];
      const mentionedById = mentionedBy.toLowerCase().replace(' ', '-');
      
      mentions.push({
        userId,
        username,
        taskId: `task-${i}`,
        taskName: `Task ${i}`,
        mentionedBy,
        mentionedById,
        mentionedAt: mentionedAt.toISOString(),
        resolved,
        resolvedAt
      });
    }
    
    return mentions;
  }
}

export default TaskAnalyticsService;

