/**
 * Action Execution Framework
 * Handles execution of workflow automation actions
 */

import { RuleContext } from './rule-engine';

// Action result interface
export interface ActionResult {
  success: boolean;
  actionId: string;
  message?: string;
  data?: Record<string, any>;
  timestamp: Date;
}

// Base action interface
export interface Action {
  id: string;
  type: string;
  name: string;
  description: string;
  execute: (context: RuleContext, params: Record<string, any>) => Promise<ActionResult>;
  validateParams: (params: Record<string, any>) => { isValid: boolean; errors: string[] };
}

// Action definition with parameters
export interface ActionDefinition {
  id: string;
  type: string;
  params: Record<string, any>;
}

/**
 * Action Executor for running workflow actions
 */
export class ActionExecutor {
  private actions: Map<string, Action> = new Map();
  private actionHistory: ActionResult[] = [];
  
  /**
   * Register an action type
   * @param action Action implementation
   */
  public registerAction(action: Action): void {
    this.actions.set(action.type, action);
    console.log(`Registered action type: ${action.type}`);
  }
  
  /**
   * Get all registered action types
   * @returns Array of action types
   */
  public getRegisteredActionTypes(): string[] {
    return Array.from(this.actions.keys());
  }
  
  /**
   * Execute a list of actions
   * @param actionIds Action IDs to execute
   * @param context Rule context
   * @returns Results of action execution
   */
  public async executeActions(
    actionIds: string[],
    context: RuleContext
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    
    // Load action definitions
    const actionDefinitions = await this.loadActionDefinitions(actionIds);
    
    // Execute actions in sequence
    for (const definition of actionDefinitions) {
      try {
        const action = this.actions.get(definition.type);
        
        if (!action) {
          const result: ActionResult = {
            success: false,
            actionId: definition.id,
            message: `Unknown action type: ${definition.type}`,
            timestamp: new Date()
          };
          
          results.push(result);
          this.actionHistory.push(result);
          continue;
        }
        
        // Validate parameters
        const validation = action.validateParams(definition.params);
        if (!validation.isValid) {
          const result: ActionResult = {
            success: false,
            actionId: definition.id,
            message: `Invalid parameters: ${validation.errors.join(', ')}`,
            timestamp: new Date()
          };
          
          results.push(result);
          this.actionHistory.push(result);
          continue;
        }
        
        // Execute action
        console.log(`Executing action: ${definition.id} (${action.type})`);
        const result = await action.execute(context, definition.params);
        
        results.push(result);
        this.actionHistory.push(result);
        
        // Stop execution if action failed
        if (!result.success) {
          console.error(`Action ${definition.id} failed: ${result.message}`);
          break;
        }
      } catch (error) {
        const result: ActionResult = {
          success: false,
          actionId: definition.id,
          message: `Action execution error: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date()
        };
        
        results.push(result);
        this.actionHistory.push(result);
        console.error(`Error executing action ${definition.id}:`, error);
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Load action definitions from storage
   * @param actionIds Action IDs to load
   * @returns Action definitions
   */
  private async loadActionDefinitions(actionIds: string[]): Promise<ActionDefinition[]> {
    // In a real implementation, this would load from database
    // For now, return mock definitions
    return actionIds.map(id => this.getMockActionDefinition(id));
  }
  
  /**
   * Get mock action definition for testing
   * @param id Action ID
   * @returns Mock action definition
   */
  private getMockActionDefinition(id: string): ActionDefinition {
    // Mock implementation - in real system, these would be stored in database
    const mockDefinitions: Record<string, ActionDefinition> = {
      'create-task': {
        id: 'create-task',
        type: 'createTask',
        params: {
          title: 'New automated task',
          description: 'This task was created by workflow automation',
          priority: 'medium',
          assigneeId: '{{user.id}}'
        }
      },
      'send-notification': {
        id: 'send-notification',
        type: 'sendNotification',
        params: {
          userId: '{{user.id}}',
          title: 'Workflow Notification',
          message: 'An automated workflow has been triggered',
          type: 'info'
        }
      },
      'update-task-status': {
        id: 'update-task-status',
        type: 'updateTaskStatus',
        params: {
          taskId: '{{data.taskId}}',
          status: 'in-progress'
        }
      },
      'assign-task': {
        id: 'assign-task',
        type: 'assignTask',
        params: {
          taskId: '{{data.taskId}}',
          userId: '{{data.assigneeId}}'
        }
      },
      'send-email': {
        id: 'send-email',
        type: 'sendEmail',
        params: {
          to: '{{data.userEmail}}',
          subject: 'Task Assignment Notification',
          template: 'task-assigned',
          data: {
            taskId: '{{data.taskId}}',
            taskTitle: '{{data.taskTitle}}'
          }
        }
      }
    };
    
    return mockDefinitions[id] || {
      id,
      type: 'unknown',
      params: {}
    };
  }
  
  /**
   * Get recent action history
   * @param limit Maximum number of history items to return
   * @returns Recent action history
   */
  public getActionHistory(limit: number = 100): ActionResult[] {
    return this.actionHistory.slice(-limit);
  }
  
  /**
   * Clear action history
   */
  public clearActionHistory(): void {
    this.actionHistory = [];
  }
}

/**
 * Base class for implementing actions
 */
export abstract class BaseAction implements Action {
  public id: string;
  public type: string;
  public name: string;
  public description: string;
  
  constructor(id: string, type: string, name: string, description: string) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.description = description;
  }
  
  /**
   * Execute the action
   * @param context Rule context
   * @param params Action parameters
   */
  public abstract execute(
    context: RuleContext,
    params: Record<string, any>
  ): Promise<ActionResult>;
  
  /**
   * Validate action parameters
   * @param params Parameters to validate
   */
  public abstract validateParams(params: Record<string, any>): { 
    isValid: boolean; 
    errors: string[] 
  };
  
  /**
   * Resolve parameter values using context
   * @param params Parameters with template strings
   * @param context Rule context
   * @returns Resolved parameters
   */
  protected resolveParams(
    params: Record<string, any>,
    context: RuleContext
  ): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        resolved[key] = this.resolveTemplateString(value, context);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveParams(value, context);
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }
  
  /**
   * Resolve template strings in the format {{path.to.value}}
   * @param template Template string
   * @param context Rule context
   * @returns Resolved string
   */
  protected resolveTemplateString(template: string, context: RuleContext): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueByPath(path.trim(), context);
      return value !== undefined ? String(value) : match;
    });
  }
  
  /**
   * Get a value from context by path
   * @param path Dot notation path
   * @param context Rule context
   * @returns Value at path
   */
  protected getValueByPath(path: string, context: RuleContext): any {
    const parts = path.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      
      value = value[part];
    }
    
    return value;
  }
}

/**
 * Create Task Action
 */
export class CreateTaskAction extends BaseAction {
  constructor() {
    super(
      'create-task-action',
      'createTask',
      'Create Task',
      'Creates a new task'
    );
  }
  
  public async execute(
    context: RuleContext,
    params: Record<string, any>
  ): Promise<ActionResult> {
    try {
      // Resolve parameter templates
      const resolvedParams = this.resolveParams(params, context);
      
      // In a real implementation, this would call the task service
      console.log('Creating task:', resolvedParams);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate mock task ID
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      return {
        success: true,
        actionId: this.id,
        message: 'Task created successfully',
        data: {
          taskId,
          ...resolvedParams
        },
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        actionId: this.id,
        message: `Failed to create task: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
    }
  }
  
  public validateParams(params: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!params.title) {
      errors.push('Task title is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Send Notification Action
 */
export class SendNotificationAction extends BaseAction {
  constructor() {
    super(
      'send-notification-action',
      'sendNotification',
      'Send Notification',
      'Sends a notification to a user'
    );
  }
  
  public async execute(
    context: RuleContext,
    params: Record<string, any>
  ): Promise<ActionResult> {
    try {
      // Resolve parameter templates
      const resolvedParams = this.resolveParams(params, context);
      
      // In a real implementation, this would call the notification service
      console.log('Sending notification:', resolvedParams);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        actionId: this.id,
        message: 'Notification sent successfully',
        data: resolvedParams,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        actionId: this.id,
        message: `Failed to send notification: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
    }
  }
  
  public validateParams(params: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!params.userId) {
      errors.push('User ID is required');
    }
    
    if (!params.message) {
      errors.push('Notification message is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Update Task Status Action
 */
export class UpdateTaskStatusAction extends BaseAction {
  constructor() {
    super(
      'update-task-status-action',
      'updateTaskStatus',
      'Update Task Status',
      'Updates the status of a task'
    );
  }
  
  public async execute(
    context: RuleContext,
    params: Record<string, any>
  ): Promise<ActionResult> {
    try {
      // Resolve parameter templates
      const resolvedParams = this.resolveParams(params, context);
      
      // In a real implementation, this would call the task service
      console.log('Updating task status:', resolvedParams);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        actionId: this.id,
        message: 'Task status updated successfully',
        data: resolvedParams,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        actionId: this.id,
        message: `Failed to update task status: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
    }
  }
  
  public validateParams(params: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!params.taskId) {
      errors.push('Task ID is required');
    }
    
    if (!params.status) {
      errors.push('Task status is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
let actionExecutor: ActionExecutor | null = null;

export function getActionExecutor(): ActionExecutor {
  if (!actionExecutor) {
    actionExecutor = new ActionExecutor();
    
    // Register default actions
    actionExecutor.registerAction(new CreateTaskAction());
    actionExecutor.registerAction(new SendNotificationAction());
    actionExecutor.registerAction(new UpdateTaskStatusAction());
  }
  
  return actionExecutor;
}
