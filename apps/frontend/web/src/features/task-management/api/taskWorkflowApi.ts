// Base API URL
const API_URL = '/api/workflow';

// Interface for workflow rule condition
export interface WorkflowRuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'within';
  value: string;
}

// Interface for workflow rule action
export interface WorkflowRuleAction {
  type: 'assign' | 'notify' | 'addTag' | 'removeTag' | 'setStatus' | 'setPriority';
  value: string;
}

// Interface for workflow rule
export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  conditions: WorkflowRuleCondition[];
  actions: WorkflowRuleAction[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Interface for creating a workflow rule
export interface CreateWorkflowRuleDto {
  name: string;
  description: string;
  conditions: WorkflowRuleCondition[];
  actions: WorkflowRuleAction[];
  isActive: boolean;
}

// Interface for updating a workflow rule
export interface UpdateWorkflowRuleDto {
  name?: string;
  description?: string;
  conditions?: WorkflowRuleCondition[];
  actions?: WorkflowRuleAction[];
  isActive?: boolean;
}

// Interface for workflow rule trigger result
export interface WorkflowRuleTriggerResult {
  taskId: string;
  event: string;
  rulesTriggered: Array<{
    ruleId: string;
    ruleName: string;
    actions: Array<{
      type: string;
      value: string;
      success: boolean;
    }>;
  }>;
  timestamp: string;
}

/**
 * Get all workflow rules
 * @returns Array of workflow rules
 */
export const getWorkflowRules = async (): Promise<WorkflowRule[]> => {
  const response = await fetch(`${API_URL}/rules`);

  if (!response.ok) {
    throw new Error(`Failed to get workflow rules: ${response.status}`);
  }

  return response.json();
};

/**
 * Create a new workflow rule
 * @param rule The rule data to create
 * @returns The created workflow rule
 */
export const createWorkflowRule = async (rule: CreateWorkflowRuleDto): Promise<WorkflowRule> => {
  const response = await fetch(`${API_URL}/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    throw new Error(`Failed to create workflow rule: ${response.status}`);
  }

  return response.json();
};

/**
 * Update an existing workflow rule
 * @param id The rule ID
 * @param rule The rule data to update
 * @returns The updated workflow rule
 */
export const updateWorkflowRule = async (id: string, rule: UpdateWorkflowRuleDto): Promise<WorkflowRule> => {
  const response = await fetch(`${API_URL}/rules/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    throw new Error(`Failed to update workflow rule: ${response.status}`);
  }

  return response.json();
};

/**
 * Delete a workflow rule
 * @param id The rule ID
 * @returns True if deletion was successful
 */
export const deleteWorkflowRule = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_URL}/rules/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete workflow rule: ${response.status}`);
  }

  return response.status === 204;
};

/**
 * Trigger workflow rules for a task event
 * @param taskId The task ID
 * @param event The event type (create, update, delete, etc.)
 * @returns Result of the workflow rule trigger
 */
export const triggerWorkflowRules = async (
  taskId: string,
  event: string
): Promise<WorkflowRuleTriggerResult> => {
  const response = await fetch(`${API_URL}/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskId, event }),
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger workflow rules: ${response.status}`);
  }

  return response.json();
};
