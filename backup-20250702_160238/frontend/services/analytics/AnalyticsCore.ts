import { TimeRange, 
  DataPoint, 
  CategoryBreakdown, 
  TaskCompletionTrend,
  AnalyticsFilter
 } from "../../../shared/types/analytics";
import { Task, TaskStatus, TaskPriority  } from "../../../shared/types/task";

/**
 * Core analytics functions for data processing
 */
class AnalyticsCore {
  /**
   * Filter tasks based on analytics filter criteria
   */
  public static filterTasks(tasks: Task[], filter?: AnalyticsFilter): Task[] {
    if (!filter) return tasks;
    
    return tasks.filter(task => {
      // Time range filter
      if (filter.timeRange) {
        const startDate = new Date(filter.timeRange.startDate);
        const endDate = new Date(filter.timeRange.endDate);
        const taskDate = new Date(task.startDate);
        
        if (taskDate < startDate || taskDate > endDate) {
          return false;
        }
      }
      
      // Project filter
      if (filter.projects && filter.projects.length > 0) {
        if (!filter.projects.includes(task.projectId)) {
          return false;
        }
      }
      
      // User filter
      if (filter.users && filter.users.length > 0) {
        if (!task.assigneeId || !filter.users.includes(task.assigneeId)) {
          return false;
        }
      }
      
      // Status filter
      if (filter.taskStatus && filter.taskStatus.length > 0) {
        if (!filter.taskStatus.includes(task.status)) {
          return false;
        }
      }
      
      // Priority filter
      if (filter.taskPriority && filter.taskPriority.length > 0) {
        if (!filter.taskPriority.includes(task.priority)) {
          return false;
        }
      }
      
      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        if (!task.tags || !task.tags.some(tag => filter.tags?.includes(tag))) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Calculate status breakdown
   */
  public static calculateStatusBreakdown(tasks: Task[]): CategoryBreakdown[] {
    const statusCounts: Record<string, number> = {};
    const totalTasks = tasks.length;
    
    // Count tasks by status
    tasks.forEach(task => {
      if (!statusCounts[task.status]) {
        statusCounts[task.status] = 0;
      }
      statusCounts[task.status]++;
    });
    
    // Convert to breakdown format
    return Object.entries(statusCounts).map(([status, count]) => ({
      category: status,
      count,
      percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0
    }));
  }
  
  /**
   * Calculate priority breakdown
   */
  public static calculatePriorityBreakdown(tasks: Task[]): CategoryBreakdown[] {
    const priorityCounts: Record<string, number> = {};
    const totalTasks = tasks.length;
    
    // Count tasks by priority
    tasks.forEach(task => {
      if (!priorityCounts[task.priority]) {
        priorityCounts[task.priority] = 0;
      }
      priorityCounts[task.priority]++;
    });
    
    // Convert to breakdown format
    return Object.entries(priorityCounts).map(([priority, count]) => ({
      category: priority,
      count,
      percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0
    }));
  }
  
  /**
   * Calculate task completion trend over time
   */
  public static calculateCompletionTrend(tasks: Task[], timeRange: TimeRange): TaskCompletionTrend[] {
    const startDate = new Date(timeRange.startDate);
    const endDate = new Date(timeRange.endDate);
    const result: TaskCompletionTrend[] = [];
    
    // Create a map of dates
    const dateMap: Map<string, { completed: number; created: number }> = new Map();
    
    // Initialize dates in the range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      dateMap.set(dateString, { completed: 0, created: 0 });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Count tasks created and completed by date
    tasks.forEach(task => {
      const createdDate = new Date(task.createdAt).toISOString().split('T')[0];
      
      // Count created tasks
      if (dateMap.has(createdDate)) {
        const data = dateMap.get(createdDate);
        if (data) {
          data.created++;
          dateMap.set(createdDate, data);
        }
      }
      
      // Count completed tasks
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
        
        if (dateMap.has(completedDate)) {
          const data = dateMap.get(completedDate);
          if (data) {
            data.completed++;
            dateMap.set(completedDate, data);
          }
        }
      }
    });
    
    // Convert map to array and calculate cumulative values
    let cumulativeCompleted = 0;
    
    Array.from(dateMap.entries()).forEach(([date, data]) => {
      cumulativeCompleted += data.completed;
      
      result.push({
        date,
        completed: data.completed,
        created: data.created,
        cumulative: cumulativeCompleted
      });
    });
    
    return result;
  }
  
  /**
   * Calculate average completion time in hours
   */
  public static calculateAverageCompletionTime(tasks: Task[]): number {
    const completedTasks = tasks.filter(task => task.completedAt && task.createdAt);
    
    if (completedTasks.length === 0) {
      return 0;
    }
    
    const totalHours = completedTasks.reduce((sum, task) => {
      const createdDate = new Date(task.createdAt);
      const completedDate = new Date(task.completedAt as string);
      const diffMs = completedDate.getTime() - createdDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      return sum + diffHours;
    }, 0);
    
    return totalHours / completedTasks.length;
  }
  
  /**
   * Calculate overdue tasks percentage
   */
  public static calculateOverduePercentage(tasks: Task[]): number {
    const tasksWithDueDate = tasks.filter(task => task.dueDate);
    
    if (tasksWithDueDate.length === 0) {
      return 0;
    }
    
    const now = new Date();
    const overdueTasks = tasksWithDueDate.filter(task => {
      const dueDate = new Date(task.dueDate as string);
      return task.status !== 'done' && dueDate < now;
    });
    
    return (overdueTasks.length / tasksWithDueDate.length) * 100;
  }
  
  /**
   * Calculate task completion rate (tasks completed per day)
   */
  public static calculateCompletionRate(tasks: Task[], days: number): number {
    const completedTasks = tasks.filter(task => task.completedAt);
    
    if (days <= 0) {
      return 0;
    }
    
    return completedTasks.length / days;
  }
  
  /**
   * Predict project completion date based on current velocity
   */
  public static predictCompletionDate(
    tasks: Task[],
    completedTasks: Task[],
    averageCompletionRate: number
  ): Date | null {
    if (averageCompletionRate <= 0) {
      return null;
    }
    
    const remainingTasks = tasks.filter(task => task.status !== 'done').length;
    const daysRemaining = remainingTasks / averageCompletionRate;
    
    const result = new Date();
    result.setDate(result.getDate() + Math.ceil(daysRemaining));
    
    return result;
  }
}

export default AnalyticsCore;

