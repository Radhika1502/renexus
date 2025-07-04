/**
 * Task Integration Service
 * Handles the integration between AI task suggestions and the task management system
 */

import { TaskSuggestion } from '../../types/ai';
import { Task, TaskPriority } from '../../types/tasks';

/**
 * Convert an AI suggestion to a task object ready for insertion into the task system
 * @param suggestion The AI generated task suggestion
 * @param userId The user ID who accepted the suggestion
 * @returns A task object ready for insertion
 */
export function convertSuggestionToTask(suggestion: TaskSuggestion, userId: string): Task {
  return {
    id: '', // Will be assigned by the task service
    title: suggestion.title,
    description: suggestion.description || '',
    priority: mapSuggestionPriorityToTaskPriority(suggestion.priority),
    status: 'todo',
    dueDate: suggestion.suggestedDueDate,
    assignedTo: userId,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    estimatedTime: suggestion.estimatedTime || 0,
    type: suggestion.type || 'task',
    tags: suggestion.tags || [],
    parentId: suggestion.parentTaskId,
    aiGenerated: true,
    aiConfidence: suggestion.confidence,
    originalSuggestionId: suggestion.id
  };
}

/**
 * Calculate task priority based on suggestion confidence level and priority
 * @param suggestionPriority The priority from the AI suggestion
 * @returns Mapped task priority
 */
export function mapSuggestionPriorityToTaskPriority(
  suggestionPriority: string
): TaskPriority {
  // Normalize priority strings
  const normalizedPriority = suggestionPriority.toLowerCase();
  
  // Map to task priority enum
  switch (normalizedPriority) {
    case 'critical':
    case 'highest':
    case 'urgent':
      return 'critical';
    
    case 'high':
    case 'important':
      return 'high';
    
    case 'medium':
    case 'normal':
    case 'moderate':
      return 'medium';
    
    case 'low':
    case 'minor':
      return 'low';
    
    default:
      return 'medium'; // Default priority if mapping not found
  }
}

/**
 * Create a task in the task management system from a suggestion
 * @param suggestion The suggestion to convert to a task
 * @param userId The user who accepted the suggestion
 * @returns The created task ID
 */
export async function createTaskFromSuggestion(
  suggestion: TaskSuggestion, 
  userId: string
): Promise<string> {
  try {
    const taskData = convertSuggestionToTask(suggestion, userId);
    
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Update suggestion status in the AI system
    await updateSuggestionStatus(suggestion.id, 'accepted', userId);
    
    return result.taskId;
  } catch (error) {
    console.error('Error creating task from suggestion:', error);
    throw error;
  }
}

/**
 * Update the status of a suggestion in the AI system
 * @param suggestionId The ID of the suggestion to update
 * @param status The new status (accepted, rejected, dismissed)
 * @param userId The ID of the user who changed the status
 * @param feedback Optional feedback from the user
 */
export async function updateSuggestionStatus(
  suggestionId: string,
  status: 'accepted' | 'rejected' | 'dismissed',
  userId: string,
  feedback?: string
): Promise<void> {
  try {
    const response = await fetch('/api/ai/task-suggestions/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        suggestionId,
        userId,
        status,
        feedback,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update suggestion status: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating suggestion status:', error);
    throw error;
  }
}

/**
 * Get suggestion statistics for a user
 * @param userId The ID of the user to get statistics for
 * @returns Suggestion statistics
 */
export async function getSuggestionStatistics(userId: string): Promise<{
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  acceptanceRate: number;
}> {
  try {
    const response = await fetch(`/api/ai/task-suggestions/stats?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get suggestion statistics: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting suggestion statistics:', error);
    throw error;
  }
}

/**
 * Register suggestion feedback in the AI system for learning
 * @param suggestionId The ID of the suggestion 
 * @param userId The ID of the user providing feedback
 * @param isHelpful Whether the suggestion was helpful
 * @param feedback Optional text feedback
 * @returns Success status
 */
export async function submitSuggestionFeedback(
  suggestionId: string,
  userId: string,
  isHelpful: boolean,
  feedback?: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/ai/task-suggestions/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        suggestionId,
        userId,
        isHelpful,
        feedback,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting suggestion feedback:', error);
    return false;
  }
}
