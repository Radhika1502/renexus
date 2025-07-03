import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TeamPerformanceDto } from './dto/team-performance.dto';
import { TimeRangeDto } from './dto/time-range.dto';
import { TaskStatusSummaryDto } from './dto/task-status-summary.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { TimelineEventDto } from './dto/timeline-event.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    // Get counts for active tasks, completed tasks, and projects
    const activeTasks = await this.prisma.task.count({
      where: {
        status: { not: 'done' }
      }
    });

    const completedTasks = await this.prisma.task.count({
      where: {
        status: 'done'
      }
    });

    const projects = await this.prisma.project.count();

    // Get upcoming deadlines (tasks due in the next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcomingDeadlines = await this.prisma.task.count({
      where: {
        dueDate: {
          gte: today,
          lte: nextWeek
        },
        status: { not: 'done' }
      }
    });

    // Count unique assignees as team members
    const uniqueAssignees = await this.prisma.task.findMany({
      where: {
        assigneeId: { not: null }
      },
      select: {
        assigneeId: true
      },
      distinct: ['assigneeId']
    });

    return {
      tasks: {
        total: activeTasks + completedTasks,
        active: activeTasks,
        completed: completedTasks,
        upcomingDeadlines
      },
      projects: {
        total: projects,
        active: projects // Since there's no status field in Project model, assume all are active
      },
      users: {
        total: uniqueAssignees.length
      }
    };
  }

  async getTaskStatusSummary(projectId?: string): Promise<TaskStatusSummaryDto[]> {
    // Get task counts by status
    const whereClause: Prisma.TaskWhereInput = {};
    if (projectId) {
      whereClause.projectId = projectId;
    }
    
    const tasksByStatus = await this.prisma.task.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        _all: true
      }
    });

    // Get total task count for percentage calculation
    const totalTasks = await this.prisma.task.count({
      where: whereClause
    });

    // Convert to expected format
    return tasksByStatus.map(statusGroup => ({
      status: statusGroup.status,
      count: statusGroup._count._all,
      percentage: totalTasks > 0 ? (statusGroup._count._all / totalTasks) * 100 : 0
    }));
  }

  async getTeamPerformance(timeRange?: TimeRangeDto): Promise<TeamPerformanceDto[]> {
    // Since there's no Team model, we'll group tasks by assigneeId and treat each assignee as a "team"
    // This is a simplified approach to match the frontend expectations
    
    // First, get all tasks with their assignees
    const whereClause: Prisma.TaskWhereInput = {};
    
    if (timeRange) {
      whereClause.createdAt = {
        gte: new Date(timeRange.start),
        lte: new Date(timeRange.end)
      };
    }

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      include: {
        timeLogs: true
      }
    });

    // Group tasks by assigneeId
    const tasksByAssignee: Record<string, any[]> = {};
    
    tasks.forEach(task => {
      if (task.assigneeId) {
        if (!tasksByAssignee[task.assigneeId]) {
          tasksByAssignee[task.assigneeId] = [];
        }
        tasksByAssignee[task.assigneeId].push(task);
      }
    });

    // Calculate performance metrics for each "team" (assignee)
    const teamPerformance: TeamPerformanceDto[] = [];
    
    for (const assigneeId of Object.keys(tasksByAssignee)) {
      const assigneeTasks = tasksByAssignee[assigneeId];
      const completedTasks = assigneeTasks.filter(task => task.status === 'done');
      const totalTasks = assigneeTasks.length;
      
      // Calculate completion rate
      const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;
      
      // Calculate average task completion time (in hours)
      let totalCompletionTime = 0;
      let tasksWithCompletionTime = 0;
      
      completedTasks.forEach(task => {
        const timeLogs = task.timeLogs || [];
        if (timeLogs.length > 0) {
          // Sum up all time logs for this task
          const totalTaskTime = timeLogs.reduce((sum: number, log: any) => {
            if (log.duration) {
              return sum + log.duration;
            }
            return sum;
          }, 0);
          
          totalCompletionTime += totalTaskTime;
          tasksWithCompletionTime++;
        }
      });
      
      // Convert seconds to hours
      const averageTaskCompletionTime = tasksWithCompletionTime > 0 
        ? (totalCompletionTime / tasksWithCompletionTime) / 3600 
        : 0;
      
      // Calculate on-time delivery rate
      const tasksWithDueDate = assigneeTasks.filter(task => task.dueDate);
      const onTimeDeliveries = tasksWithDueDate.filter(task => {
        if (task.status === 'done' && task.dueDate) {
          // For on-time delivery, we'll use updatedAt as a proxy for completion date
          return task.updatedAt <= task.dueDate;
        }
        return false;
      });
      
      const onTimeDeliveryRate = tasksWithDueDate.length > 0 
        ? onTimeDeliveries.length / tasksWithDueDate.length 
        : 0;
      
      teamPerformance.push({
        teamId: assigneeId,
        teamName: `Team Member ${assigneeId.substring(0, 6)}`, // Use a placeholder name
        completedTasks: completedTasks.length,
        totalTasks,
        completionRate,
        averageTaskCompletionTime,
        onTimeDeliveryRate
      });
    }
    
    return teamPerformance;
  }

  async getTimelineEvents(timeRange?: TimeRangeDto): Promise<TimelineEventDto[]> {
    const whereClause: Prisma.TaskWhereInput = {};
    
    if (timeRange) {
      whereClause.createdAt = {
        gte: new Date(timeRange.start),
        lte: new Date(timeRange.end)
      };
    }

    // Get tasks for timeline events
    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        project: true
      },
      take: 50 // Limit to most recent 50 events
    });

    // Create timeline events
    const timelineEvents: TimelineEventDto[] = [];

    tasks.forEach(task => {
      // Task creation events
      timelineEvents.push({
        id: `task-created-${task.id}`,
        title: `Task Created: ${task.title}`,
        description: task.description || undefined,
        date: task.createdAt.toISOString(),
        type: 'TASK_CREATED',
        entityId: task.id,
        entityType: 'TASK',
        projectId: task.projectId,
        projectName: task.project?.name || 'Unknown Project'
      });

      // Task completion events (for done tasks)
      if (task.status === 'done') {
        timelineEvents.push({
          id: `task-completed-${task.id}`,
          title: `Task Completed: ${task.title}`,
          description: task.description || undefined,
          date: task.updatedAt.toISOString(), // Using updatedAt as a proxy for completion date
          type: 'TASK_COMPLETED',
          entityId: task.id,
          entityType: 'TASK',
          projectId: task.projectId,
          projectName: task.project?.name || 'Unknown Project'
        });
      }
    });

    // Sort timeline events by date (newest first)
    return timelineEvents.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  async getProjectSummaries(timeRange?: TimeRangeDto): Promise<any[]> {
    // Get all projects with their tasks
    const projects = await this.prisma.project.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            dueDate: true,
            updatedAt: true,
            createdAt: true
          }
        }
      }
    });

    return projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Determine project status based on progress and due dates
      let status = 'on track';
      if (progress === 100) {
        status = 'completed';
      } else if (progress < 50) {
        status = 'behind';
      } else if (progress < 80) {
        status = 'at risk';
      }

      // Find the earliest task creation date as project start
      const taskDates = project.tasks.map(task => task.createdAt);
      const startDate = taskDates.length > 0 ? new Date(Math.min(...taskDates.map(d => d.getTime()))) : null;
      
      // Find the latest due date as project end
      const dueDates = project.tasks.filter(task => task.dueDate).map(task => task.dueDate!);
      const dueDate = dueDates.length > 0 ? new Date(Math.max(...dueDates.map(d => d.getTime()))) : null;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status,
        progress,
        tasksTotal: totalTasks,
        tasksCompleted: completedTasks,
        dueDate: dueDate?.toISOString(),
        startDate: startDate?.toISOString()
      };
    });
  }

  async getActivityFeed(limit: number = 10): Promise<any[]> {
    // Get recent task activities
    const recentTasks = await this.prisma.task.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        project: true
      },
      take: limit * 2 // Get more to filter and format
    });

    const activities = [];

    for (const task of recentTasks) {
      // Task creation activity
      activities.push({
        id: `activity-created-${task.id}`,
        userId: task.assigneeId || 'system',
        userName: 'System User', // In a real implementation, fetch from user table
        userAvatar: null,
        action: 'created task',
        entityType: 'TASK',
        entityName: task.title,
        entityId: task.id,
        projectId: task.projectId,
        projectName: task.project?.name || 'Unknown Project',
        timestamp: task.createdAt.toISOString()
      });

      // Task status change activity (if updated recently)
      if (task.updatedAt.getTime() !== task.createdAt.getTime()) {
        activities.push({
          id: `activity-updated-${task.id}`,
          userId: task.assigneeId || 'system',
          userName: 'System User',
          userAvatar: null,
          action: `updated task status to ${task.status}`,
          entityType: 'TASK',
          entityName: task.title,
          entityId: task.id,
          projectId: task.projectId,
          projectName: task.project?.name || 'Unknown Project',
          timestamp: task.updatedAt.toISOString()
        });
      }
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}
