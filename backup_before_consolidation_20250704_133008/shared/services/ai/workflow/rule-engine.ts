/**
 * AI Workflow Automation Rule Engine
 * Provides functionality for defining, validating, and evaluating automation rules
 */

// Rule condition types
export type ConditionOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 
                               'greaterThan' | 'lessThan' | 'exists' | 'notExists' |
                               'startsWith' | 'endsWith' | 'matches';

// Rule condition definition
export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value?: any;
}

// Rule definition with conditions and metadata
export interface Rule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  actions: string[];
  priority: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  triggerEvents: string[];
}

// Context for rule evaluation
export interface RuleContext {
  event: string;
  data: Record<string, any>;
  user: {
    id: string;
    roles: string[];
  };
}

/**
 * Rule validation result
 */
export interface RuleValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Rule Engine class for managing and evaluating workflow rules
 */
export class RuleEngine {
  private rules: Rule[] = [];

  /**
   * Add a rule to the engine
   * @param rule Rule to add
   */
  public addRule(rule: Rule): void {
    // Validate rule before adding
    const validation = this.validateRule(rule);
    if (!validation.isValid) {
      throw new Error(`Invalid rule: ${validation.errors.join(', ')}`);
    }
    
    this.rules.push(rule);
  }

  /**
   * Remove a rule from the engine
   * @param ruleId ID of rule to remove
   */
  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Get all rules in the engine
   * @returns Array of rules
   */
  public getAllRules(): Rule[] {
    return [...this.rules];
  }

  /**
   * Get rules that match a specific event trigger
   * @param eventType Event type to match
   * @returns Array of matching rules
   */
  public getRulesByEvent(eventType: string): Rule[] {
    return this.rules.filter(rule => 
      rule.isActive && rule.triggerEvents.includes(eventType)
    );
  }

  /**
   * Validate a rule definition
   * @param rule Rule to validate
   * @returns Validation result
   */
  public validateRule(rule: Rule): RuleValidationResult {
    const errors: string[] = [];
    
    // Check required fields
    if (!rule.id) errors.push('Rule ID is required');
    if (!rule.name) errors.push('Rule name is required');
    if (!rule.conditions || rule.conditions.length === 0) errors.push('At least one condition is required');
    if (!rule.actions || rule.actions.length === 0) errors.push('At least one action is required');
    if (!rule.triggerEvents || rule.triggerEvents.length === 0) errors.push('At least one trigger event is required');
    
    // Validate conditions
    rule.conditions.forEach((condition, index) => {
      if (!condition.field) errors.push(`Condition ${index + 1}: Field is required`);
      if (!condition.operator) errors.push(`Condition ${index + 1}: Operator is required`);
      
      // Check if value is required for this operator
      const valueRequiredOperators: ConditionOperator[] = [
        'equals', 'notEquals', 'contains', 'notContains', 
        'greaterThan', 'lessThan', 'startsWith', 'endsWith', 'matches'
      ];
      
      if (valueRequiredOperators.includes(condition.operator) && condition.value === undefined) {
        errors.push(`Condition ${index + 1}: Value is required for operator '${condition.operator}'`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Evaluate rules against a context
   * @param context Context for rule evaluation
   * @returns Array of matching rules
   */
  public evaluateRules(context: RuleContext): Rule[] {
    // Get rules for this event type
    const matchingRules = this.getRulesByEvent(context.event);
    
    // Evaluate each rule's conditions
    const triggeredRules = matchingRules.filter(rule => this.evaluateConditions(rule.conditions, context));
    
    // Sort by priority (higher number = higher priority)
    return triggeredRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate all conditions for a rule
   * @param conditions Conditions to evaluate
   * @param context Context for evaluation
   * @returns True if all conditions pass
   */
  private evaluateConditions(conditions: RuleCondition[], context: RuleContext): boolean {
    // All conditions must pass (AND logic)
    return conditions.every(condition => this.evaluateCondition(condition, context));
  }

  /**
   * Evaluate a single condition
   * @param condition Condition to evaluate
   * @param context Context for evaluation
   * @returns True if condition passes
   */
  private evaluateCondition(condition: RuleCondition, context: RuleContext): boolean {
    // Extract field value from context
    const fieldValue = this.getFieldValue(condition.field, context);
    
    // Evaluate based on operator
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      
      case 'notEquals':
        return fieldValue !== condition.value;
      
      case 'contains':
        if (typeof fieldValue === 'string') {
          return fieldValue.includes(String(condition.value));
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(condition.value);
        }
        return false;
      
      case 'notContains':
        if (typeof fieldValue === 'string') {
          return !fieldValue.includes(String(condition.value));
        }
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(condition.value);
        }
        return true;
      
      case 'greaterThan':
        return fieldValue > condition.value;
      
      case 'lessThan':
        return fieldValue < condition.value;
      
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      
      case 'notExists':
        return fieldValue === undefined || fieldValue === null;
      
      case 'startsWith':
        return typeof fieldValue === 'string' && fieldValue.startsWith(String(condition.value));
      
      case 'endsWith':
        return typeof fieldValue === 'string' && fieldValue.endsWith(String(condition.value));
      
      case 'matches':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          try {
            const regex = new RegExp(condition.value);
            return regex.test(fieldValue);
          } catch (e) {
            console.error('Invalid regex pattern:', e);
            return false;
          }
        }
        return false;
      
      default:
        console.error(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Get a field value from the context using dot notation
   * @param field Field path (e.g., "data.task.priority")
   * @param context Context object
   * @returns Field value or undefined
   */
  private getFieldValue(field: string, context: RuleContext): any {
    const parts = field.split('.');
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

// Export singleton instance
let ruleEngine: RuleEngine | null = null;

export function getRuleEngine(): RuleEngine {
  if (!ruleEngine) {
    ruleEngine = new RuleEngine();
  }
  
  return ruleEngine;
}
