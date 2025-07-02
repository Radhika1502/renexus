/**
 * Workflow Monitoring System
 * Provides monitoring, logging, and analytics for workflow automation
 */

import { ActionResult } from './action-executor';
import { Rule } from './rule-engine';
import { EventPayload } from './trigger-system';

// Workflow execution record
export interface WorkflowExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  eventType: string;
  triggeredAt: Date;
  completedAt: Date | null;
  status: 'running' | 'completed' | 'failed';
  actions: ActionResult[];
  error?: string;
  context: {
    userId: string;
    eventSource: string;
    eventData: Record<string, any>;
  };
}

// Workflow statistics
export interface WorkflowStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTimeMs: number;
  executionsByRule: Record<string, number>;
  executionsByEvent: Record<string, number>;
  executionsByStatus: Record<string, number>;
  recentFailures: WorkflowExecution[];
}

/**
 * Workflow Monitor for tracking and analyzing workflow executions
 */
export class WorkflowMonitor {
  private executions: WorkflowExecution[] = [];
  private maxHistorySize: number = 1000;
  
  /**
   * Record the start of a workflow execution
   * @param rule Rule that triggered the workflow
   * @param event Event that triggered the rule
   * @returns Workflow execution ID
   */
  public startExecution(rule: Rule, event: EventPayload): string {
    const executionId = `wf-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    const execution: WorkflowExecution = {
      id: executionId,
      ruleId: rule.id,
      ruleName: rule.name,
      eventType: event.eventType,
      triggeredAt: new Date(),
      completedAt: null,
      status: 'running',
      actions: [],
      context: {
        userId: event.userId,
        eventSource: event.source,
        eventData: { ...event.data }
      }
    };
    
    this.executions.push(execution);
    this.trimHistory();
    
    return executionId;
  }
  
  /**
   * Record the completion of a workflow execution
   * @param executionId Workflow execution ID
   * @param actions Actions that were executed
   * @param success Whether the workflow completed successfully
   * @param error Error message if the workflow failed
   */
  public completeExecution(
    executionId: string,
    actions: ActionResult[],
    success: boolean,
    error?: string
  ): void {
    const execution = this.executions.find(e => e.id === executionId);
    
    if (execution) {
      execution.completedAt = new Date();
      execution.status = success ? 'completed' : 'failed';
      execution.actions = [...actions];
      
      if (error) {
        execution.error = error;
      }
    }
  }
  
  /**
   * Get a specific workflow execution by ID
   * @param executionId Workflow execution ID
   * @returns Workflow execution or undefined if not found
   */
  public getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.find(e => e.id === executionId);
  }
  
  /**
   * Get recent workflow executions
   * @param limit Maximum number of executions to return
   * @param filter Optional filter function
   * @returns Recent workflow executions
   */
  public getRecentExecutions(
    limit: number = 100,
    filter?: (execution: WorkflowExecution) => boolean
  ): WorkflowExecution[] {
    let result = this.executions;
    
    if (filter) {
      result = result.filter(filter);
    }
    
    // Sort by triggered time, newest first
    return result
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }
  
  /**
   * Get workflow statistics
   * @param timeRangeMs Time range in milliseconds (default: 24 hours)
   * @returns Workflow statistics
   */
  public getStatistics(timeRangeMs: number = 24 * 60 * 60 * 1000): WorkflowStatistics {
    const now = Date.now();
    const cutoff = now - timeRangeMs;
    
    // Filter executions within time range
    const recentExecutions = this.executions.filter(
      e => e.triggeredAt.getTime() >= cutoff
    );
    
    // Count executions by rule
    const executionsByRule: Record<string, number> = {};
    recentExecutions.forEach(e => {
      executionsByRule[e.ruleId] = (executionsByRule[e.ruleId] || 0) + 1;
    });
    
    // Count executions by event
    const executionsByEvent: Record<string, number> = {};
    recentExecutions.forEach(e => {
      executionsByEvent[e.eventType] = (executionsByEvent[e.eventType] || 0) + 1;
    });
    
    // Count executions by status
    const executionsByStatus: Record<string, number> = {};
    recentExecutions.forEach(e => {
      executionsByStatus[e.status] = (executionsByStatus[e.status] || 0) + 1;
    });
    
    // Calculate average execution time
    let totalTimeMs = 0;
    let completedCount = 0;
    
    recentExecutions.forEach(e => {
      if (e.completedAt && e.status === 'completed') {
        totalTimeMs += e.completedAt.getTime() - e.triggeredAt.getTime();
        completedCount++;
      }
    });
    
    const averageExecutionTimeMs = completedCount > 0 
      ? totalTimeMs / completedCount 
      : 0;
    
    // Get recent failures
    const recentFailures = recentExecutions
      .filter(e => e.status === 'failed')
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, 10);
    
    return {
      totalExecutions: recentExecutions.length,
      successfulExecutions: recentExecutions.filter(e => e.status === 'completed').length,
      failedExecutions: recentExecutions.filter(e => e.status === 'failed').length,
      averageExecutionTimeMs,
      executionsByRule,
      executionsByEvent,
      executionsByStatus,
      recentFailures
    };
  }
  
  /**
   * Get workflow executions for a specific rule
   * @param ruleId Rule ID
   * @param limit Maximum number of executions to return
   * @returns Workflow executions for the rule
   */
  public getExecutionsByRule(ruleId: string, limit: number = 100): WorkflowExecution[] {
    return this.getRecentExecutions(limit, e => e.ruleId === ruleId);
  }
  
  /**
   * Get workflow executions for a specific event type
   * @param eventType Event type
   * @param limit Maximum number of executions to return
   * @returns Workflow executions for the event type
   */
  public getExecutionsByEventType(eventType: string, limit: number = 100): WorkflowExecution[] {
    return this.getRecentExecutions(limit, e => e.eventType === eventType);
  }
  
  /**
   * Get workflow executions for a specific user
   * @param userId User ID
   * @param limit Maximum number of executions to return
   * @returns Workflow executions for the user
   */
  public getExecutionsByUser(userId: string, limit: number = 100): WorkflowExecution[] {
    return this.getRecentExecutions(limit, e => e.context.userId === userId);
  }
  
  /**
   * Get failed workflow executions
   * @param limit Maximum number of executions to return
   * @returns Failed workflow executions
   */
  public getFailedExecutions(limit: number = 100): WorkflowExecution[] {
    return this.getRecentExecutions(limit, e => e.status === 'failed');
  }
  
  /**
   * Trim execution history to maximum size
   */
  private trimHistory(): void {
    if (this.executions.length > this.maxHistorySize) {
      // Sort by triggered time, oldest first
      this.executions.sort((a, b) => a.triggeredAt.getTime() - b.triggeredAt.getTime());
      
      // Remove oldest executions
      this.executions = this.executions.slice(
        this.executions.length - this.maxHistorySize
      );
    }
  }
  
  /**
   * Clear execution history
   */
  public clearHistory(): void {
    this.executions = [];
  }
}

/**
 * Workflow Analytics for generating insights from workflow data
 */
export class WorkflowAnalytics {
  private monitor: WorkflowMonitor;
  
  constructor(monitor: WorkflowMonitor) {
    this.monitor = monitor;
  }
  
  /**
   * Get workflow performance metrics
   * @param timeRangeMs Time range in milliseconds
   * @returns Performance metrics
   */
  public getPerformanceMetrics(timeRangeMs: number = 24 * 60 * 60 * 1000): Record<string, any> {
    const stats = this.monitor.getStatistics(timeRangeMs);
    
    return {
      successRate: stats.totalExecutions > 0 
        ? stats.successfulExecutions / stats.totalExecutions 
        : 0,
      averageExecutionTimeMs: stats.averageExecutionTimeMs,
      throughput: stats.totalExecutions / (timeRangeMs / 1000 / 60), // executions per minute
      failureRate: stats.totalExecutions > 0 
        ? stats.failedExecutions / stats.totalExecutions 
        : 0
    };
  }
  
  /**
   * Get most active rules
   * @param limit Maximum number of rules to return
   * @returns Most active rules with execution counts
   */
  public getMostActiveRules(limit: number = 10): { ruleId: string; count: number }[] {
    const stats = this.monitor.getStatistics();
    
    return Object.entries(stats.executionsByRule)
      .map(([ruleId, count]) => ({ ruleId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  /**
   * Get most triggered events
   * @param limit Maximum number of events to return
   * @returns Most triggered events with counts
   */
  public getMostTriggeredEvents(limit: number = 10): { eventType: string; count: number }[] {
    const stats = this.monitor.getStatistics();
    
    return Object.entries(stats.executionsByEvent)
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
  
  /**
   * Get common failure patterns
   * @returns Common failure patterns with counts
   */
  public getCommonFailurePatterns(): { pattern: string; count: number }[] {
    const failedExecutions = this.monitor.getFailedExecutions(100);
    const errorPatterns: Record<string, number> = {};
    
    failedExecutions.forEach(execution => {
      if (execution.error) {
        // Extract error pattern (first line or first 50 chars)
        const pattern = execution.error.split('\n')[0].substring(0, 50);
        errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;
      }
    });
    
    return Object.entries(errorPatterns)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Get rule efficiency metrics
   * @returns Rule efficiency metrics
   */
  public getRuleEfficiencyMetrics(): { 
    ruleId: string; 
    successRate: number; 
    avgExecutionTimeMs: number 
  }[] {
    const stats = this.monitor.getStatistics();
    const result: { 
      ruleId: string; 
      successRate: number; 
      avgExecutionTimeMs: number 
    }[] = [];
    
    // For each rule with executions
    for (const ruleId of Object.keys(stats.executionsByRule)) {
      const executions = this.monitor.getExecutionsByRule(ruleId);
      
      if (executions.length === 0) continue;
      
      // Calculate success rate
      const successfulCount = executions.filter(e => e.status === 'completed').length;
      const successRate = successfulCount / executions.length;
      
      // Calculate average execution time
      let totalTimeMs = 0;
      let completedCount = 0;
      
      executions.forEach(e => {
        if (e.completedAt && e.status === 'completed') {
          totalTimeMs += e.completedAt.getTime() - e.triggeredAt.getTime();
          completedCount++;
        }
      });
      
      const avgExecutionTimeMs = completedCount > 0 
        ? totalTimeMs / completedCount 
        : 0;
      
      result.push({
        ruleId,
        successRate,
        avgExecutionTimeMs
      });
    }
    
    // Sort by success rate (descending)
    return result.sort((a, b) => b.successRate - a.successRate);
  }
}

// Export singleton instances
let workflowMonitor: WorkflowMonitor | null = null;
let workflowAnalytics: WorkflowAnalytics | null = null;

export function getWorkflowMonitor(): WorkflowMonitor {
  if (!workflowMonitor) {
    workflowMonitor = new WorkflowMonitor();
  }
  
  return workflowMonitor;
}

export function getWorkflowAnalytics(): WorkflowAnalytics {
  if (!workflowAnalytics) {
    workflowAnalytics = new WorkflowAnalytics(getWorkflowMonitor());
  }
  
  return workflowAnalytics;
}
