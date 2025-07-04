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
    // Get counts for different task statuses
    const totalTasks = await this.prisma.task.count();
    const completedTasks = await this.prisma.task.count({
      where: { status: 'COMPLETED' }
    });
    const inProgressTasks = await this.prisma.task.count({
      where: { status: 'IN_PROGRESS' }
    });
    const pendingTasks = await this.prisma.task.count({
      where: { status: 'PENDING' }
    });

    // Get project counts
    const totalProjects = await this.prisma.project.count();
    const activeProjects = await this.prisma.project.count(); // Assuming all projects are active

    // Get user count - for now, count unique assignees since we don't have actual users
    const uniqueAssignees = await this.prisma.task.findMany({
      where: { assigneeId: { not: null } },
      select: { assigneeId: true },
      distinct: ['assigneeId']
    });
    const totalUsers = uniqueAssignees.length;

    return {
      tasks: {
        total: totalTasks,
        active: inProgressTasks + pendingTasks,
        completed: completedTasks,
        upcomingDeadlines: 0, // TODO: Calculate upcoming deadlines
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
      },
      users: {
        total: totalUsers,
      },
    };
  }

  async getTaskStatusSummary(projectId?: string, timeRange?: TimeRangeDto): Promise<TaskStatusSummaryDto[]> {
    // Get all tasks matching the criteria
    const whereClause: Prisma.TaskWhereInput = {};
    if (projectId) {
      whereClause.projectId = projectId;
    }
    if (timeRange) {
      whereClause.createdAt = {
        gte: new Date(timeRange.start),
        lte: new Date(timeRange.end)
      };
    }
    
    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      select: { status: true },
    });

    // Group tasks by status
    const statusCounts: Record<string, number> = {};
    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    const totalTasks = tasks.length;

    // Convert to expected format
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0,
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

  async getProjectMetrics(projectId: string, timeRange?: TimeRangeDto): Promise<any> {
    // Get project with all related data
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            timeLogs: true
          }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const tasks = project.tasks;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    const pendingTasks = tasks.filter(task => task.status === 'todo').length;

    // Calculate time metrics
    const totalTimeSpent = tasks.reduce((total, task) => {
      const taskTime = task.timeLogs?.reduce((taskTotal, log) => taskTotal + (log.duration || 0), 0) || 0;
      return total + taskTime;
    }, 0);

    // Calculate completion rate trend
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate average task completion time
    const completedTasksWithTime = tasks.filter(task => 
      task.status === 'done' && task.timeLogs && task.timeLogs.length > 0
    );
    
    const averageCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((total, task) => {
          const taskTime = task.timeLogs?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;
          return total + taskTime;
        }, 0) / completedTasksWithTime.length
      : 0;

    // Risk assessment
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date() > task.dueDate && task.status !== 'done'
    ).length;

    const riskLevel = overdueTasks > totalTasks * 0.3 ? 'high' 
      : overdueTasks > totalTasks * 0.1 ? 'medium' 
      : 'low';

    return {
      projectId,
      projectName: project.name,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate,
      totalTimeSpent: Math.round(totalTimeSpent / 3600), // Convert to hours
      averageCompletionTime: Math.round(averageCompletionTime / 3600), // Convert to hours
      overdueTasks,
      riskLevel,
      startDate: project.createdAt.toISOString(),
      estimatedEndDate: project.description // Placeholder for actual end date
    };
  }

  async getUserPerformance(teamId?: string, timeRange?: TimeRangeDto): Promise<any[]> {
    // Get tasks assigned to users
    const whereClause: Prisma.TaskWhereInput = {
      assigneeId: { not: null }
    };

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

    // Group tasks by assignee (user)
    const tasksByUser: Record<string, any[]> = {};
    tasks.forEach(task => {
      if (task.assigneeId) {
        if (!tasksByUser[task.assigneeId]) {
          tasksByUser[task.assigneeId] = [];
        }
        tasksByUser[task.assigneeId].push(task);
      }
    });

    // Calculate performance metrics for each user
    return Object.entries(tasksByUser).map(([userId, userTasks]) => {
      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter(task => task.status === 'done').length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate total time spent
      const totalTimeSpent = userTasks.reduce((total, task) => {
        const taskTime = task.timeLogs?.reduce((sum: number, log: any) => sum + (log.duration || 0), 0) || 0;
        return total + taskTime;
      }, 0);

      // Calculate average task time
      const averageTaskTime = completedTasks > 0 ? totalTimeSpent / completedTasks : 0;

      // Calculate on-time delivery
      const onTimeDeliveries = userTasks.filter(task => {
        if (task.status === 'done' && task.dueDate) {
          return task.updatedAt <= task.dueDate;
        }
        return false;
      }).length;

      const tasksWithDueDate = userTasks.filter(task => task.dueDate).length;
      const onTimeRate = tasksWithDueDate > 0 ? (onTimeDeliveries / tasksWithDueDate) * 100 : 0;

      return {
        userId,
        userName: `User ${userId.substring(0, 6)}`, // Placeholder name
        totalTasks,
        completedTasks,
        completionRate,
        totalTimeSpent: Math.round(totalTimeSpent / 3600), // Convert to hours
        averageTaskTime: Math.round(averageTaskTime / 3600), // Convert to hours
        onTimeDeliveryRate: onTimeRate,
        productivityScore: Math.round((completionRate + onTimeRate) / 2)
      };
    });
  }

  async getProjectRisks(projectId?: string): Promise<any[]> {
    const whereClause: Prisma.ProjectWhereInput = {};
    if (projectId) {
      whereClause.id = projectId;
    }

    const projects = await this.prisma.project.findMany({
      where: whereClause,
      include: {
        tasks: true
      }
    });

    const risks: any[] = [];

    projects.forEach(project => {
      const tasks = project.tasks;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'done').length;
      const overdueTasks = tasks.filter(task => 
        task.dueDate && new Date() > task.dueDate && task.status !== 'done'
      );

      // Risk: Overdue tasks
      if (overdueTasks.length > 0) {
        risks.push({
          id: `overdue-${project.id}`,
          projectId: project.id,
          projectName: project.name,
          type: 'OVERDUE_TASKS',
          severity: overdueTasks.length > totalTasks * 0.3 ? 'HIGH' : 'MEDIUM',
          title: `${overdueTasks.length} Overdue Tasks`,
          description: `Project has ${overdueTasks.length} tasks that are past their due date`,
          impact: 'Delivery delay',
          probability: 'High',
          mitigation: 'Reassign resources or extend deadlines',
          createdAt: new Date().toISOString()
        });
      }

      // Risk: Low completion rate
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      if (completionRate < 30 && totalTasks > 3) {
        risks.push({
          id: `low-completion-${project.id}`,
          projectId: project.id,
          projectName: project.name,
          type: 'LOW_COMPLETION_RATE',
          severity: 'MEDIUM',
          title: 'Low Completion Rate',
          description: `Project completion rate is only ${completionRate.toFixed(1)}%`,
          impact: 'Project delays',
          probability: 'Medium',
          mitigation: 'Review task assignments and remove blockers',
          createdAt: new Date().toISOString()
        });
      }

      // Risk: No recent activity
      const recentTasks = tasks.filter(task => {
        const daysSinceUpdate = (new Date().getTime() - task.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate <= 7;
      });

      if (recentTasks.length === 0 && tasks.length > 0) {
        risks.push({
          id: `no-activity-${project.id}`,
          projectId: project.id,
          projectName: project.name,
          type: 'NO_RECENT_ACTIVITY',
          severity: 'LOW',
          title: 'No Recent Activity',
          description: 'No task updates in the last 7 days',
          impact: 'Project stagnation',
          probability: 'Low',
          mitigation: 'Check with team members and update task status',
          createdAt: new Date().toISOString()
        });
      }
    });

    return risks.sort((a, b) => {
      const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  async exportProjectReport(projectId: string, format: 'pdf' | 'csv' | 'excel'): Promise<any> {
    // Get project metrics
    const metrics = await this.getProjectMetrics(projectId);
    
    // For now, return a mock response indicating the export would be generated
    return {
      success: true,
      message: `${format.toUpperCase()} report for project ${projectId} would be generated`,
      format,
      projectId,
      fileName: `project-${projectId}-report.${format}`,
      data: metrics
    };
  }

  async exportTeamReport(teamId: string, format: 'pdf' | 'csv' | 'excel'): Promise<any> {
    // For now, return a mock response indicating the export would be generated
    return {
      success: true,
      message: `${format.toUpperCase()} report for team ${teamId} would be generated`,
      format,
      teamId,
      fileName: `team-${teamId}-report.${format}`,
      data: {
        teamId,
        reportGenerated: new Date().toISOString()
      }
    };
  }
}
