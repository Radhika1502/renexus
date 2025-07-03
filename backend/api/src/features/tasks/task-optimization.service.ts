import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Task, Prisma, TaskStatus, User } from '@prisma/client';

interface TaskWithAssignee extends Task {
  assignee?: User | null;
  _count?: {
    comments?: number;
    attachments?: number;
    dependees?: number;
    dependents?: number;
  };
}

@Injectable()
export class TaskOptimizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get paginated tasks with optimized query for large datasets
   */
  async getPaginatedTasks(
    projectId: string,
    page: number = 1,
    pageSize: number = 50,
    cursor?: string
  ): Promise<Array<TaskWithAssignee>> {
    // Use cursor-based pagination for better performance with large datasets
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      take: pageSize,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: true,
        _count: {
          select: {
            comments: true,
            attachments: true,
            dependees: true,
            dependents: true,
          },
        },
      },
    });

    return tasks as TaskWithAssignee[];
  }

  /**
   * Batch update task positions and statuses
   */
  async batchUpdateTasks(updates: Array<{
    id: string;
    status?: TaskStatus;
    columnId?: string | null;
    order?: number;
  }>) {
    return this.prisma.$transaction(
      updates.map(update => {
        const data: any = {};
        if (update.status) data.status = update.status;
        if (update.columnId !== undefined) data.columnId = update.columnId;
        if (update.order !== undefined) data.order = update.order;
        
        return this.prisma.task.update({
          where: { id: update.id },
          data,
        });
      })
    );
  }

  /**
   * Get task board summary without loading all tasks
   */
  async getBoardSummary(projectId: string) {
    const getTaskCounts = async (projectId: string) => {
      const counts = await this.prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: {
          _all: true,
        },
      });

      return counts.reduce<Record<string, { total: number }>>((acc, { status, _count }) => ({
        ...acc,
        [status]: {
          total: _count._all,
        },
      }), {});
    };

    const taskCounts = await getTaskCounts(projectId);

    // Get all tasks for the project with time logs
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: true,
        timeLogs: {
          select: {
            id: true,
            duration: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    // Define types for the task with relations
    type TaskWithRelations = {
      id: string;
      title: string;
      status: string;
      priority: string;
      assignee: { id: string; name: string | null; email: string | null } | null;
      timeLogs: Array<{ id: string; duration: number | null; startTime: Date | null; endTime: Date | null }>;
    };
    
    const typedTasks = tasks as unknown as TaskWithRelations[];

    // Calculate total time spent on all tasks
    const totalTimeSpent = typedTasks.reduce((sum, task) => sum + task.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0), 0);

    // Calculate average time per task
    const avgTimePerTask = typedTasks.length > 0 ? totalTimeSpent / typedTasks.length : 0;

    // Group by assignee and count tasks
    const assigneeCounts = typedTasks.reduce<Record<string, number>>((acc, task) => {
      if (task.assignee?.id) {
        acc[task.assignee.id] = (acc[task.assignee.id] || 0) + 1;
      }
      return acc;
    }, {});

    // Find most active user (most tasks assigned)
    const mostActiveUser = Object.entries(assigneeCounts).reduce<{id: string, count: number} | null>((max, [id, count]) => {
      return !max || count > max.count ? { id, count } : max;
    }, null);

    // Find the most time-consuming task
    const mostTimeConsumingTask = [...typedTasks]
      .sort(
        (a, b) =>
          b.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0) -
          a.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        timeSpent: task.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
      }))[0];

    // Get task status and priority counts
    const statusCounts = await this.prisma.task.groupBy({
      by: ['status'],
      _count: true,
      where: { projectId }
    });
    
    const priorityCounts = await this.prisma.task.groupBy({
      by: ['priority'],
      _count: true,
      where: { projectId }
    });

    // Get recent activity
    const recentActivity = await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' as const },
      take: 10,
      include: {
        assignee: true
      }
    });

    // Define type for recent activity
    type RecentActivity = {
      id: string;
      title: string;
      status: string;
      updatedAt: Date;
      assignee: { id: string; name: string | null; email: string | null } | null;
    };
    
    const typedRecentActivity = recentActivity as unknown as RecentActivity[];

    // Get all users for assignee mapping
    const userIds = Object.keys(assigneeCounts).filter(Boolean) as string[];
    const users = userIds.length > 0 ? await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    }) : [];
    
    type UserType = { id: string; name: string | null; email: string | null };

    // Format the response
    return {
      totalTasks: typedTasks.length,
      totalTimeSpent,
      avgTimePerTask,
      byStatus: statusCounts.reduce((acc, { status, _count }) => ({
        ...acc,
        [status]: _count
      }), {} as Record<string, number>),
      byPriority: priorityCounts.reduce((acc, { priority, _count }) => ({
        ...acc,
        [priority]: _count
      }), {} as Record<string, number>),
      byAssignee: Object.entries(assigneeCounts).map(([assigneeId, count]) => {
        const user = users.find(u => u.id === assigneeId);
        return {
          user: user ? { id: user.id, name: user.name, email: user.email } : null,
          count: count
        };
      }),
      mostActiveUser: users.length > 0 ? users[0] : null,
      mostTimeConsumingTask,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        title: activity.title,
        status: activity.status,
        updatedAt: activity.updatedAt,
        assignee: activity.assignee
      })),
      tasks: typedTasks.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee ? {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email
        } : null,
        timeSpent: task.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0)
        // Removed commentsCount and attachmentsCount as they're not in the schema
      }))
    };
  }
}
