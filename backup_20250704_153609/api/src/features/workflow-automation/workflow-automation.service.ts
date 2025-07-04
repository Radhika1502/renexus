import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Task, Project, TeamMember } from "../../../shared/types/models";
import { TaskSuggestion } from './types';

// Define rule types for the workflow engine
type Rule = {
  id: string;
  name: string;
  description: string;
  condition: (task: Task, project: Project) => Promise<boolean>;
  action: (task: Task) => TaskSuggestion | null;
  priority: number; // Higher number = higher priority
};

@Injectable()
export class WorkflowAutomationService {
  private suggestions: Map<string, TaskSuggestion> = new Map();
  private rules: Rule[] = [];
  
  constructor(private prisma: PrismaService) {
    // Initialize the rules engine with default rules
    this.initializeRules();
  }
  
  /**
   * Initialize the workflow automation rules
   */
  private initializeRules(): void {
    // Rule 1: Unassigned tasks should be assigned to team members with capacity
    this.rules.push({
      id: 'unassigned-task-rule',
      name: 'Unassigned Task Assignment',
      description: 'Suggests team members for unassigned tasks based on workload and expertise',
      condition: async (task: Task) => !task.assigneeId,
      action: (task: Task) => ({
        id: `assign-${task.id}-${Date.now()}`,
        type: 'ASSIGNMENT',
        taskId: task.id,
        suggestion: 'Assign this task to a team member',
        reason: 'This task is unassigned and should be allocated to a team member',
        data: {}
      }),
      priority: 10
    });
    
    // Rule 2: Stalled tasks should be prioritized
    this.rules.push({
      id: 'stalled-task-rule',
      name: 'Stalled Task Prioritization',
      description: 'Identifies and suggests prioritization for tasks that have been stalled',
      condition: async (task: Task) => {
        if (!task.updatedAt) return false;
        const lastUpdate = new Date(task.updatedAt);
        const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 3600 * 24);
        return daysSinceUpdate > 7 && task.status !== 'COMPLETED';
      },
      action: (task: Task) => ({
        id: `prioritize-${task.id}-${Date.now()}`,
        type: 'PRIORITIZATION',
        taskId: task.id,
        suggestion: 'Increase priority of this stalled task',
        reason: `This task has been stalled for ${Math.floor((Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 3600 * 24))} days`,
        data: { priority: 'HIGH' }
      }),
      priority: 8
    });
    
    // Rule 3: Tasks with all subtasks completed should be marked for review
    this.rules.push({
      id: 'complete-subtasks-rule',
      name: 'Complete Subtasks Status Change',
      description: 'Suggests status change when all subtasks are completed',
      condition: async (task: Task) => {
        if (task.status !== 'IN_PROGRESS') return false;
        
        const subtasks = await this.prisma.$queryRaw<Task[]>`SELECT * FROM "Task" WHERE "parentTaskId" = ${task.id}`;
        return subtasks.length > 0 && subtasks.every((subtask: Task) => subtask.status === 'COMPLETED');
      },
      action: (task: Task) => ({
        id: `status-${task.id}-${Date.now()}`,
        type: 'STATUS_CHANGE',
        taskId: task.id,
        suggestion: 'Mark this task as ready for review',
        reason: 'All subtasks are completed. This task is ready for review.',
        data: { status: 'COMPLETED' }
      }),
      priority: 9
    });
    
    // Rule 4: Workload balancing for overloaded team members
    this.rules.push({
      id: 'workload-balance-rule',
      name: 'Workload Balancing',
      description: 'Suggests reassignment of tasks from overloaded team members',
      condition: async (task: Task) => {
        if (!task.assigneeId) return false;
        
        // Check if assignee has too many tasks
        const assignedTasksCountResult = await this.prisma.$queryRaw<{count: number}[]>`
          SELECT COUNT(*) as count FROM "Task" 
          WHERE "assigneeId" = ${task.assigneeId} AND status != 'COMPLETED'
        `;
        const assignedTasksCount = assignedTasksCountResult[0]?.count || 0;
        
        return assignedTasksCount > 10; // Threshold for overload
      },
      action: (task: Task) => ({
        id: `workload-${task.id}-${Date.now()}`,
        type: 'WORKLOAD_BALANCING',
        taskId: task.id,
        suggestion: 'Reassign this task to balance workload',
        reason: 'The current assignee has too many active tasks',
        data: {}
      }),
      priority: 7
    });
  }
  
  /**
   * Generate workflow suggestions for a project
   * @param project The project to analyze
   * @returns List of task suggestions
   */
  async generateSuggestions(project: Project): Promise<TaskSuggestion[]> {
    if (!project.tasks || project.tasks.length === 0) {
      return [];
    }
    
    const suggestions: TaskSuggestion[] = [];
    
    // Process each task through the rules engine
    for (const task of project.tasks) {
      // Apply each rule in priority order
      for (const rule of this.rules.sort((a, b) => b.priority - a.priority)) {
        // Check if the rule condition applies to this task
        if (await rule.condition(task, project)) {
          // Generate the suggestion
          const baseSuggestion = rule.action(task);
          
          if (baseSuggestion) {
            // For assignment suggestions, find the best assignee
            if (baseSuggestion.type === 'ASSIGNMENT') {
              const bestAssignee = await this.findBestAssignee(task, project.id);
              if (bestAssignee) {
                baseSuggestion.data.assigneeId = bestAssignee.id;
                baseSuggestion.suggestion = `Assign to ${bestAssignee.name}`;
                baseSuggestion.reason = `${bestAssignee.name} has expertise in similar tasks and currently has capacity.`;
              } else {
                // Skip if no suitable assignee found
                continue;
              }
            }
            
            // Store and return the suggestion
            this.suggestions.set(baseSuggestion.id, baseSuggestion);
            suggestions.push(baseSuggestion);
            
            // Only apply the highest priority rule for each task
            break;
          }
        }
      }
    }
    
    return suggestions;
  }
  
  /**
   * Apply a workflow suggestion to a task
   * @param suggestionId ID of the suggestion to apply
   * @returns Success status
   */
  async applySuggestion(suggestionId: string): Promise<boolean> {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion) {
      return false;
    }
    
    try {
      switch (suggestion.type) {
        case 'ASSIGNMENT':
          await this.prisma.task.update({
            where: { id: suggestion.taskId },
            data: { assigneeId: suggestion.data.assigneeId }
          });
          break;
          
        case 'PRIORITIZATION':
          await this.prisma.task.update({
            where: { id: suggestion.taskId },
            data: { priority: suggestion.data.priority }
          });
          break;
          
        case 'STATUS_CHANGE':
          await this.prisma.task.update({
            where: { id: suggestion.taskId },
            data: { status: suggestion.data.status }
          });
          break;
          
        case 'WORKLOAD_BALANCING':
          // Find a better assignee with lower workload
          const task = await this.prisma.task.findUnique({
            where: { id: suggestion.taskId }
          });
          
          if (task) {
            const bestAssignee = await this.findBestAssignee(task, task.projectId);
            if (bestAssignee) {
              await this.prisma.task.update({
                where: { id: suggestion.taskId },
                data: { assigneeId: bestAssignee.id }
              });
            }
          }
          break;
      }
      
      // Log the application of the suggestion
      await this.prisma.$queryRaw`
        INSERT INTO "WorkflowActionLog" ("suggestionId", "taskId", "actionType", "appliedAt", "success") 
        VALUES (${suggestion.id}, ${suggestion.taskId}, ${suggestion.type}, NOW(), true)
      `.catch(err => console.error('Failed to log workflow action:', err));
      
      // Remove the suggestion once applied
      this.suggestions.delete(suggestionId);
      return true;
    } catch (error) {
      console.error('Error applying suggestion:', error);
      
      // Log the failed application
      await this.prisma.$queryRaw`
        INSERT INTO "WorkflowActionLog" ("suggestionId", "taskId", "actionType", "appliedAt", "success", "errorMessage") 
        VALUES (${suggestion.id}, ${suggestion.taskId}, ${suggestion.type}, NOW(), false, ${error.message})
      `.catch(err => console.error('Failed to log workflow action error:', err));
      
      return false;
    }
  }
  
  /**
   * Dismiss a workflow suggestion without applying it
   * @param suggestionId ID of the suggestion to dismiss
   * @returns Success status
   */
  async dismissSuggestion(suggestionId: string): Promise<boolean> {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion) {
      return false;
    }
    
    // Log the dismissal
    await this.prisma.$queryRaw`
      INSERT INTO "WorkflowActionLog" ("suggestionId", "taskId", "actionType", "appliedAt", "success", "dismissed") 
      VALUES (${suggestion.id}, ${suggestion.taskId}, ${suggestion.type}, NOW(), true, true)
    `.catch(err => console.error('Failed to log workflow dismissal:', err));
    
    this.suggestions.delete(suggestionId);
    return true;
  }
  
  /**
   * Find the best team member to assign a task to
   * @param task The task to assign
   * @param projectId The project ID
   * @returns The best team member or null if none found
   */
  async findBestAssignee(task: Task, projectId: string): Promise<User | null> {
    // Get team members for this project
    const teamMembersResult = await this.prisma.$queryRaw<User[]>`
      SELECT u.* FROM "User" u
      JOIN "ProjectMember" pm ON u.id = pm."userId"
      WHERE pm."projectId" = ${projectId}
    `;
    
    if (!teamMembersResult.length) {
      return null;
    }
    
    // Calculate workload scores for all team members
    const workloadScores = await this.calculateTeamMemberWorkload(teamMembersResult);
    
    // Calculate expertise scores based on similar tasks
    const expertiseScores = await this.calculateExpertiseScores(teamMembersResult, task);
    
    // Combine scores (lower is better)
    const combinedScores = teamMembersResult.map(member => {
      const workloadScore = workloadScores.find(ws => ws.member.id === member.id)?.score || 100;
      const expertiseScore = expertiseScores.find(es => es.member.id === member.id)?.score || 0;
      
      // Normalize scores: workload (lower is better) and expertise (higher is better)
      // Final score = workload - expertise (lower is better)
      return {
        member,
        score: workloadScore - (expertiseScore * 2) // Weight expertise more heavily
      };
    });
    
    // Sort by combined score (ascending)
    return combinedScores.sort((a, b) => a.score - b.score)[0]?.member || null;
  }
  
  /**
   * Calculate workload scores for team members
   * @param teamMembers List of team members
   * @returns Workload scores (lower is better)
   */
  async calculateTeamMemberWorkload(teamMembers: User[]): Promise<{member: User; score: number}[]> {
    return await Promise.all(teamMembers.map(async (member: User) => {
      // Count active tasks
      const activeTasksCountResult = await this.prisma.$queryRaw<{count: number}[]>`
        SELECT COUNT(*) as count FROM "Task" 
        WHERE "assigneeId" = ${member.id} AND status != 'COMPLETED'
      `;
      const activeTasksCount = activeTasksCountResult[0]?.count || 0;
      
      // Count high priority tasks (weighted more)
      const highPriorityTasksCountResult = await this.prisma.$queryRaw<{count: number}[]>`
        SELECT COUNT(*) as count FROM "Task" 
        WHERE "assigneeId" = ${member.id} AND status != 'COMPLETED' AND priority IN ('HIGH', 'URGENT')
      `;
      const highPriorityTasksCount = highPriorityTasksCountResult[0]?.count || 0;
      
      // Calculate workload score (lower is better)
      const score = activeTasksCount + (highPriorityTasksCount * 2);
      
      return {
        member,
        score
      };
    }));
  }
  
  /**
   * Calculate expertise scores for team members based on similar tasks
   * @param teamMembers List of team members
   * @param task The task to find expertise for
   * @returns Expertise scores (higher is better)
   */
  async calculateExpertiseScores(teamMembers: User[], task: Task): Promise<{member: User; score: number}[]> {
    return await Promise.all(teamMembers.map(async (member: User) => {
      // Check completed similar tasks
      const similarTasksCountResult = await this.prisma.$queryRaw<{count: number}[]>`
        SELECT COUNT(*) as count FROM "Task" 
        WHERE "assigneeId" = ${member.id} 
        AND status = 'COMPLETED' 
        AND (title ILIKE ${`%${task.title.substring(0, Math.min(task.title.length, 10))}%`} 
             OR description ILIKE ${`%${task.description ? task.description.substring(0, Math.min(task.description.length, 20)) : ''}%`})
      `;
      const similarTasksCount = similarTasksCountResult[0]?.count || 0;
      
      // Check if member has worked on tasks in the same project
      const projectTasksCountResult = await this.prisma.$queryRaw<{count: number}[]>`
        SELECT COUNT(*) as count FROM "Task" 
        WHERE "assigneeId" = ${member.id} 
        AND "projectId" = ${task.projectId}
        AND status = 'COMPLETED'
      `;
      const projectTasksCount = projectTasksCountResult[0]?.count || 0;
      
      // Calculate expertise score (higher is better)
      const score = (similarTasksCount * 3) + projectTasksCount;
      
      return {
        member,
        score
      };
    }));
  }
}
