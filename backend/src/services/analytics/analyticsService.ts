import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../utils/logger';
import { QueryOptimizer } from '../database/queryOptimizer';

const logger = createLogger('AnalyticsService');

interface AnalyticsQuery {
  startDate: Date;
  endDate: Date;
  groupBy?: string[];
  filters?: Record<string, any>;
  metrics?: string[];
}

interface AnalyticsResult {
  data: any[];
  metadata: {
    total: number;
    aggregates: Record<string, number>;
    timeRange: {
      start: Date;
      end: Date;
    };
  };
}

export class AnalyticsService {
  private queryOptimizer: QueryOptimizer;

  constructor(private prisma: PrismaClient) {
    this.queryOptimizer = new QueryOptimizer(prisma);
  }

  public async getTaskAnalytics(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const { startDate, endDate, groupBy = [], filters = {}, metrics = [] } = query;

    const baseQuery = {
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...filters,
      },
    };

    // Get task completion trends
    const completionTrends = await this.prisma.task.groupBy({
      by: [...groupBy, 'status'],
      where: baseQuery.where,
      _count: true,
    });

    // Get average completion time
    const completionTime = await this.prisma.task.aggregate({
      where: {
        ...baseQuery.where,
        completedAt: { not: null },
      },
      _avg: {
        completionTime: true,
      },
    });

    // Get user productivity metrics
    const userProductivity = await this.prisma.task.groupBy({
      by: ['assigneeId'],
      where: baseQuery.where,
      _count: true,
      _avg: {
        completionTime: true,
      },
    });

    // Get project progress
    const projectProgress = await this.prisma.project.findMany({
      where: {
        tasks: {
          some: baseQuery.where,
        },
      },
      include: {
        tasks: {
          where: baseQuery.where,
          select: {
            status: true,
          },
        },
      },
    });

    // Calculate project completion percentages
    const projectMetrics = projectProgress.map(project => ({
      projectId: project.id,
      projectName: project.name,
      totalTasks: project.tasks.length,
      completedTasks: project.tasks.filter(t => t.status === 'COMPLETED').length,
      completionPercentage: (
        project.tasks.filter(t => t.status === 'COMPLETED').length /
        project.tasks.length
      ) * 100,
    }));

    return {
      data: [
        {
          completionTrends,
          completionTime: completionTime._avg.completionTime,
          userProductivity,
          projectMetrics,
        },
      ],
      metadata: {
        total: completionTrends.reduce((acc, curr) => acc + curr._count, 0),
        aggregates: {
          avgCompletionTime: completionTime._avg.completionTime || 0,
          totalProjects: projectMetrics.length,
          overallCompletion: (
            projectMetrics.reduce((acc, curr) => acc + curr.completionPercentage, 0) /
            projectMetrics.length
          ),
        },
        timeRange: {
          start: startDate,
          end: endDate,
        },
      },
    };
  }

  public async getResourceUtilization(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const { startDate, endDate, filters = {} } = query;

    // Get user workload distribution
    const userWorkload = await this.prisma.user.findMany({
      where: filters,
      include: {
        assignedTasks: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    // Calculate workload metrics
    const workloadMetrics = userWorkload.map(user => ({
      userId: user.id,
      userName: user.name,
      totalTasks: user.assignedTasks.length,
      activeTasks: user.assignedTasks.filter(t => t.status === 'IN_PROGRESS').length,
      completedTasks: user.assignedTasks.filter(t => t.status === 'COMPLETED').length,
      utilizationRate: (
        user.assignedTasks.filter(t => t.status === 'IN_PROGRESS').length /
        user.assignedTasks.length
      ) * 100,
    }));

    return {
      data: workloadMetrics,
      metadata: {
        total: workloadMetrics.length,
        aggregates: {
          totalUsers: workloadMetrics.length,
          avgUtilization: (
            workloadMetrics.reduce((acc, curr) => acc + curr.utilizationRate, 0) /
            workloadMetrics.length
          ),
          totalTasks: workloadMetrics.reduce((acc, curr) => acc + curr.totalTasks, 0),
        },
        timeRange: {
          start: startDate,
          end: endDate,
        },
      },
    };
  }

  public async getProjectTimeline(projectId: string): Promise<AnalyticsResult> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' },
          include: {
            assignee: true,
            comments: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate timeline metrics
    const timelineEvents = project.tasks.flatMap(task => [
      {
        type: 'TASK_CREATED',
        date: task.createdAt,
        taskId: task.id,
        taskTitle: task.title,
      },
      ...(task.completedAt ? [{
        type: 'TASK_COMPLETED',
        date: task.completedAt,
        taskId: task.id,
        taskTitle: task.title,
      }] : []),
      ...task.comments.map(comment => ({
        type: 'COMMENT_ADDED',
        date: comment.createdAt,
        taskId: task.id,
        taskTitle: task.title,
        commentId: comment.id,
      })),
    ]).sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      data: timelineEvents,
      metadata: {
        total: timelineEvents.length,
        aggregates: {
          totalTasks: project.tasks.length,
          completedTasks: project.tasks.filter(t => t.completedAt).length,
          totalComments: project.tasks.reduce((acc, task) => acc + task.comments.length, 0),
        },
        timeRange: {
          start: project.createdAt,
          end: new Date(),
        },
      },
    };
  }

  public async generateCustomReport(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const { metrics = [], filters = {}, groupBy = [] } = query;

    const reportData = await Promise.all(
      metrics.map(async metric => {
        switch (metric) {
          case 'taskCompletion':
            return this.getTaskAnalytics(query);
          case 'resourceUtilization':
            return this.getResourceUtilization(query);
          default:
            throw new Error(`Unsupported metric: ${metric}`);
        }
      })
    );

    return {
      data: reportData.map(result => result.data).flat(),
      metadata: {
        total: reportData.reduce((acc, result) => acc + result.metadata.total, 0),
        aggregates: reportData.reduce((acc, result) => ({
          ...acc,
          ...result.metadata.aggregates,
        }), {}),
        timeRange: {
          start: query.startDate,
          end: query.endDate,
        },
      },
    };
  }
} 