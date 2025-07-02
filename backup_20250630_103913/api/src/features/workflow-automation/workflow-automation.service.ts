import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Task, Project, TeamMember } from '../../types/models';

export interface TaskSuggestion {
  id: string;
  taskId: string;
  title: string;
  description: string;
  suggestedAction: 'assign' | 'prioritize' | 'status_change';
  suggestedValue?: string;
  confidence: number;
  reason: string;
  createdAt: Date;
}

@Injectable()
export class WorkflowAutomationService {
  private suggestions: Map<string, TaskSuggestion> = new Map();
  
  constructor(private prisma: PrismaService) {}
  
  async generateSuggestions(project: Project): Promise<TaskSuggestion[]> {
    if (!project.tasks || project.tasks.length === 0) {
      return [];
    }
    const suggestions: TaskSuggestion[] = [];
    
    // Analyze tasks without assignees
    const unassignedTasks = project.tasks.filter((task: Task) => !task.assigneeId);
    for (const task of unassignedTasks as Task[]) {
      // Suggest assignment based on team member expertise and workload
      const bestAssignee = await this.findBestAssignee(task, project.id);
      if (bestAssignee) {
        const suggestion: TaskSuggestion = {
          id: `assign-${task.id}-${Date.now()}`,
          taskId: task.id,
          title: task.title,
          description: task.description || '',
          suggestedAction: 'assign',
          suggestedValue: bestAssignee.id,
          confidence: 0.85,
          reason: `${bestAssignee.name} has expertise in similar tasks and currently has capacity.`,
          createdAt: new Date()
        };
        
        suggestions.push(suggestion);
        this.suggestions.set(suggestion.id, suggestion);
      }
    }
    
    // Analyze stalled tasks
    const stalledTasks = project.tasks.filter((task: Task) => {
      // Tasks that haven't been updated in 7 days and aren't completed
      if (!task.updatedAt) return false;
      const lastUpdate = new Date(task.updatedAt);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 3600 * 24);
      return daysSinceUpdate > 7 && task.status !== 'COMPLETED';
    });
    
    for (const task of stalledTasks as Task[]) {
      const suggestion: TaskSuggestion = {
        id: `prioritize-${task.id}-${Date.now()}`,
        taskId: task.id,
        title: task.title,
        description: task.description || '',
        suggestedAction: 'prioritize',
        confidence: 0.75,
        reason: `This task has been stalled for ${Math.floor((Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 3600 * 24))} days.`,
        createdAt: new Date()
      };
      
      suggestions.push(suggestion);
      this.suggestions.set(suggestion.id, suggestion);
    }
    
    // Analyze tasks ready for status change
    const inProgressTasks = project.tasks.filter((task: Task) => task.status === 'IN_PROGRESS');
    for (const task of inProgressTasks as Task[]) {
      // Check if all subtasks are completed
      const subtasks = await this.prisma.$queryRaw<Task[]>`SELECT * FROM "Task" WHERE "parentTaskId" = ${task.id}`;
      const allSubtasksCompleted = subtasks.length > 0 && subtasks.every((subtask: Task) => subtask.status === 'COMPLETED');
      
      if (allSubtasksCompleted) {
        const suggestion: TaskSuggestion = {
          id: `status-${task.id}-${Date.now()}`,
          taskId: task.id,
          title: task.title,
          description: task.description || '',
          suggestedAction: 'status_change',
          suggestedValue: 'REVIEW',
          confidence: 0.9,
          reason: 'All subtasks are completed. This task is ready for review.',
          createdAt: new Date()
        };
        
        suggestions.push(suggestion);
        this.suggestions.set(suggestion.id, suggestion);
      }
    }
    
    return suggestions;
  }
  
  async applySuggestion(suggestionId: string): Promise<boolean> {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion) {
      return false;
    }
    
    try {
      switch (suggestion.suggestedAction) {
        case 'assign':
          await this.prisma.task.update({
            where: { id: suggestion.taskId },
            data: { assigneeId: suggestion.suggestedValue }
          });
          break;
          
        case 'prioritize':
          await this.prisma.task.update({
            where: { id: suggestion.taskId },
            data: { priority: 'HIGH' }
          });
          break;
          
        case 'status_change':
          await this.prisma.task.update({
            where: { id: suggestion.taskId },
            data: { status: suggestion.suggestedValue }
          });
          break;
      }
      
      // Remove the suggestion once applied
      this.suggestions.delete(suggestionId);
      return true;
    } catch (error) {
      console.error('Error applying suggestion:', error);
      return false;
    }
  }
  
  async dismissSuggestion(suggestionId: string): Promise<boolean> {
    const exists = this.suggestions.has(suggestionId);
    if (exists) {
      this.suggestions.delete(suggestionId);
      return true;
    }
    return false;
  }
  
  private async findBestAssignee(task: Task, projectId: string): Promise<TeamMember | null> {
    // Get team members for this project
    const teamMembersResult = await this.prisma.$queryRaw<TeamMember[]>`
      SELECT u.* FROM "User" u
      JOIN "ProjectMember" pm ON u.id = pm."userId"
      WHERE pm."projectId" = ${projectId}
    `;
    
    if (!teamMembersResult.length) {
      return null;
    }
    
    // Simple algorithm: find team member with fewest assigned tasks
    const memberScores = await Promise.all(teamMembersResult.map(async (member: TeamMember) => {
      const assignedTasksCountResult = await this.prisma.$queryRaw<{count: number}[]>`
        SELECT COUNT(*) as count FROM "Task" 
        WHERE "assigneeId" = ${member.id} AND status != 'COMPLETED'
      `;
      const assignedTasksCount = assignedTasksCountResult[0]?.count || 0;
      
      return {
        member,
        score: assignedTasksCount
      };
    }));
    
    // Sort by task count (ascending)
    return memberScores.sort((a: {score: number; member: TeamMember}, b: {score: number; member: TeamMember}) => a.score - b.score)[0]?.member || null;
  }
}
