/**
 * Automation Trigger System
 * Handles event registration, filtering, and dispatching for workflow automation
 */

import { RuleEngine, RuleContext } from './rule-engine';
import { ActionExecutor } from './action-executor';

// Event payload interface
export interface EventPayload {
  eventType: string;
  data: Record<string, any>;
  timestamp: Date;
  source: string;
  userId: string;
}

// Event listener interface
export interface EventListener {
  id: string;
  eventTypes: string[];
  filter?: (payload: EventPayload) => boolean;
  handler: (payload: EventPayload) => Promise<void>;
  priority: number;
}

/**
 * Trigger System for handling workflow automation events
 */
export class TriggerSystem {
  private listeners: EventListener[] = [];
  private ruleEngine: RuleEngine;
  private actionExecutor: ActionExecutor;
  
  constructor(ruleEngine: RuleEngine, actionExecutor: ActionExecutor) {
    this.ruleEngine = ruleEngine;
    this.actionExecutor = actionExecutor;
  }
  
  /**
   * Register an event listener
   * @param listener Event listener to register
   * @returns Listener ID
   */
  public addEventListener(listener: EventListener): string {
    this.listeners.push(listener);
    return listener.id;
  }
  
  /**
   * Remove an event listener
   * @param listenerId ID of listener to remove
   */
  public removeEventListener(listenerId: string): void {
    this.listeners = this.listeners.filter(listener => listener.id !== listenerId);
  }
  
  /**
   * Dispatch an event to all matching listeners
   * @param payload Event payload
   */
  public async dispatchEvent(payload: EventPayload): Promise<void> {
    console.log(`Dispatching event: ${payload.eventType}`);
    
    // Find matching listeners
    const matchingListeners = this.listeners.filter(listener => 
      listener.eventTypes.includes(payload.eventType) &&
      (!listener.filter || listener.filter(payload))
    );
    
    // Sort by priority (higher number = higher priority)
    const sortedListeners = matchingListeners.sort((a, b) => b.priority - a.priority);
    
    // Execute listeners
    const promises = sortedListeners.map(listener => 
      listener.handler(payload).catch(error => 
        console.error(`Error in event listener ${listener.id}:`, error)
      )
    );
    
    await Promise.all(promises);
    
    // Process through rule engine
    await this.processRules(payload);
  }
  
  /**
   * Process event through rule engine
   * @param payload Event payload
   */
  private async processRules(payload: EventPayload): Promise<void> {
    try {
      // Create rule context from event payload
      const context: RuleContext = {
        event: payload.eventType,
        data: payload.data,
        user: {
          id: payload.userId,
          roles: payload.data.userRoles || []
        }
      };
      
      // Evaluate rules
      const triggeredRules = this.ruleEngine.evaluateRules(context);
      
      if (triggeredRules.length > 0) {
        console.log(`Triggered ${triggeredRules.length} rules for event ${payload.eventType}`);
        
        // Execute actions for each triggered rule
        for (const rule of triggeredRules) {
          await this.actionExecutor.executeActions(rule.actions, context);
        }
      }
    } catch (error) {
      console.error('Error processing rules:', error);
    }
  }
  
  /**
   * Register default system event listeners
   */
  public registerSystemListeners(): void {
    // Log all events
    this.addEventListener({
      id: 'system-logger',
      eventTypes: ['*'],
      priority: -100, // Low priority, run after others
      handler: async (payload) => {
        console.log(`Event: ${payload.eventType}`, {
          timestamp: payload.timestamp,
          source: payload.source,
          userId: payload.userId
        });
      }
    });
    
    // Task creation event listener
    this.addEventListener({
      id: 'task-created-handler',
      eventTypes: ['task.created'],
      priority: 10,
      handler: async (payload) => {
        // Example handler for task creation
        console.log('New task created:', payload.data.taskId);
      }
    });
    
    // Task status change event listener
    this.addEventListener({
      id: 'task-status-changed-handler',
      eventTypes: ['task.status.changed'],
      priority: 10,
      handler: async (payload) => {
        // Example handler for task status change
        console.log(`Task ${payload.data.taskId} status changed to ${payload.data.newStatus}`);
      }
    });
    
    // Project deadline approaching event listener
    this.addEventListener({
      id: 'project-deadline-handler',
      eventTypes: ['project.deadline.approaching'],
      priority: 20, // Higher priority
      handler: async (payload) => {
        // Example handler for project deadline approaching
        console.log(`Project ${payload.data.projectId} deadline approaching: ${payload.data.daysRemaining} days remaining`);
      }
    });
  }
}

/**
 * Event publisher for triggering workflow events
 */
export class EventPublisher {
  private triggerSystem: TriggerSystem;
  
  constructor(triggerSystem: TriggerSystem) {
    this.triggerSystem = triggerSystem;
  }
  
  /**
   * Publish an event
   * @param eventType Type of event
   * @param data Event data
   * @param userId User ID
   * @param source Source of event
   */
  public async publishEvent(
    eventType: string,
    data: Record<string, any>,
    userId: string,
    source: string = 'system'
  ): Promise<void> {
    const payload: EventPayload = {
      eventType,
      data,
      timestamp: new Date(),
      source,
      userId
    };
    
    await this.triggerSystem.dispatchEvent(payload);
  }
}

// Export singleton instances
let triggerSystem: TriggerSystem | null = null;
let eventPublisher: EventPublisher | null = null;

export function getTriggerSystem(): TriggerSystem {
  if (!triggerSystem) {
    const ruleEngine = require('./rule-engine').getRuleEngine();
    const actionExecutor = require('./action-executor').getActionExecutor();
    triggerSystem = new TriggerSystem(ruleEngine, actionExecutor);
    triggerSystem.registerSystemListeners();
  }
  
  return triggerSystem;
}

export function getEventPublisher(): EventPublisher {
  if (!eventPublisher) {
    eventPublisher = new EventPublisher(getTriggerSystem());
  }
  
  return eventPublisher;
}
