import { PrismaService } from '../prisma.service';
import { TimeRangeDto } from './dto/time-range.dto';

export class DashboardService {
  constructor(private prisma: PrismaService) {}

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