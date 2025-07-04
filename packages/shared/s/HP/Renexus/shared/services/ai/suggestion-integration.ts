import { TaskSuggestion } from '../../types/ai';
import { Task, TaskPriority } from '../../types/task';

/**
 * Integration service that connects AI task suggestions with the task management system
 */

// Interface for task creation from suggestion
interface TaskFromSuggestion {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate?: Date;
  type: string;
  suggestedById: string;
  suggestedAt: Date;
  originalSuggestionId: string;
}

/**
 * Transforms an AI task suggestion into a task object ready for creation
 * @param suggestion The AI task suggestion to transform
 * @param userId The user ID who accepted the suggestion
 * @returns A task object ready to be created in the task management system
 */
export function transformSuggestionToTask(suggestion: TaskSuggestion, userId: string): TaskFromSuggestion {
  // Map suggestion priority to task priority
  const taskPriority: TaskPriority = 
    suggestion.priority === 'High' ? 'high' :
    suggestion.priority === 'Medium' ? 'medium' : 'low';
  
  return {
    title: suggestion.title,
    description: suggestion.description,
    priority: taskPriority,
    dueDate: suggestion.suggestedDueDate ? new Date(suggestion.suggestedDueDate) : undefined,
    type: suggestion.type,
    suggestedById: 'ai-assistant', // Special ID for the AI assistant
    suggestedAt: new Date(),
    originalSuggestionId: suggestion.id
  };
}

/**
 * Creates a task in the task management system from an AI suggestion
 * @param suggestion The AI task suggestion to convert to a task
 * @param userId The user ID who accepted the suggestion
 * @returns The created task ID
 */
export async function createTaskFromSuggestion(
  suggestion: TaskSuggestion, 
  userId: string
): Promise<string> {
  try {
    // Transform the suggestion to a task
    const taskData = transformSuggestionToTask(suggestion, userId);
    
    // In a real implementation, this would call the task management API
    // For now, we'll simulate the API call with a mock implementation
    console.log(`Creating task from suggestion: ${JSON.stringify(taskData)}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate a mock task ID
    const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Log the success
    console.log(`Task created with ID: ${taskId}`);
    
    // Update suggestion history to mark as accepted and converted
    await updateSuggestionStatus(suggestion.id, userId, true);
    
    return taskId;
  } catch (error) {
    console.error('Error creating task from suggestion:', error);
    throw new Error('Failed to create task from suggestion');
  }
}

/**
 * Updates the status of a suggestion in the suggestion history
 * @param suggestionId The ID of the suggestion
 * @param userId The user ID
 * @param accepted Whether the suggestion was accepted
 */
async function updateSuggestionStatus(
  suggestionId: string,
  userId: string,
  accepted: boolean
): Promise<void> {
  try {
    // In a real implementation, this would update the suggestion history in the database
    console.log(`Updating suggestion ${suggestionId} status for user ${userId}: ${accepted ? 'accepted' : 'rejected'}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    console.error('Error updating suggestion status:', error);
  }
}

/**
 * Inherits task priority from the AI suggestion confidence level
 * @param suggestion The AI task suggestion
 * @returns The appropriate task priority
 */
export function calculateTaskPriorityFromSuggestion(suggestion: TaskSuggestion): TaskPriority {
  // Calculate priority based on confidence and original priority
  const confidenceBoost = suggestion.confidence >= 0.8 ? 1 : 
                          suggestion.confidence >= 0.5 ? 0 : -1;
  
  const basePriority = 
    suggestion.priority === 'High' ? 2 :
    suggestion.priority === 'Medium' ? 1 : 0;
  
  const finalPriority = Math.min(Math.max(basePriority + confidenceBoost, 0), 2);
  
  return finalPriority === 2 ? 'high' : 
         finalPriority === 1 ? 'medium' : 'low';
}

/**
 * Gets statistics about suggestion acceptance and task creation
 * @param userId The user ID
 * @returns Statistics about suggestion usage
 */
export async function getSuggestionStats(userId: string): Promise<{
  totalSuggestions: number;
  acceptedSuggestions: number;
  rejectedSuggestions: number;
  completedTasks: number;
  acceptanceRate: number;
}> {
  // In a real implementation, this would query the database
  // For now, we'll return mock statistics
  return {
    totalSuggestions: 42,
    acceptedSuggestions: 28,
    rejectedSuggestions: 14,
    completedTasks: 22,
    acceptanceRate: 0.67 // 67%
  };
}
