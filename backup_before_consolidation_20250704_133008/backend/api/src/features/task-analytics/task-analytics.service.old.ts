import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TaskAnalyticsFilters, TaskAnalyticsResponse, UserMention } from '../../shared/types/task-analytics';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaskAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive task analytics data with optional filters
   */
  async getTaskAnalytics(filters?: TaskAnalyticsFilters): Promise<TaskAnalyticsResponse> {
    const { projectId, startDate, endDate, userId, status, page = 1, pageSize = 10 } = filters || {};
    
    // Validate page and pageSize
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('Invalid pagination parameters. Page must be >= 1 and pageSize must be between 1 and 100.');
    }
    
    // Build where clause based on filters
    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (userId) {
      where.assignees = {
        some: {
          userId
        }
      };
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    
    // Get total count for pagination
    const totalTasks = await this.prisma.task.count({ where });
    
    // Get paginated tasks
    const tasks = await this.prisma.task.findMany({
      where,
      skip,
      take,
      include: {
        assignees: true,
        comments: true,
        timeLogs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Calculate metrics
    const completedTasks = await this.prisma.task.count({
      where: { ...where, status: 'DONE' },
    });
    
    const overdueTasks = await this.prisma.task.count({
      where: {
        ...where,
        dueDate: { lt: new Date() },
        status: { not: 'DONE' },
      },
    });
    
    const tasksWithoutAssignee = await this.prisma.task.count({
      where: {
        ...where,
        assignees: { none: {} },
      },
    });
    
    // Calculate completion trend (last 7 days)
    const trendData = await this.prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM Task
      WHERE 
        ${projectId ? Prisma.sql`projectId = ${projectId} AND` : Prisma.empty}
        ${status ? Prisma.sql`status = ${status} AND` : Prisma.empty}
        createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;
    
    // Calculate status distribution
    const statusDistribution = await this.prisma.task.groupBy({
      by: ['status'],
      _count: { _all: true },
      where,
    });
    
    // Calculate priority distribution
    const priorityDistribution = await this.prisma.task.groupBy({
      by: ['priority'],
      _count: { _all: true },
      where,
    });
    
    // Calculate average completion time (in hours)
    const completionTimeResult = await this.prisma.$queryRaw`
      SELECT AVG(TIMESTAMPDIFF(HOUR, createdAt, updatedAt)) as avgCompletionTime
      FROM Task
      WHERE 
        status = 'DONE'
        ${projectId ? Prisma.sql`AND projectId = ${projectId}` : Prisma.empty}
    `;
    
    const avgCompletionTime = completionTimeResult[0]?.avgCompletionTime || 0;
    
    // Format the response
    const response: TaskAnalyticsResponse = {
      metrics: {
        totalTasks,
        completedTasks,
        overdueTasks,
        tasksWithoutAssignee,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        avgCompletionTime,
      },
      statusDistribution: statusDistribution.reduce((acc, item) => ({
        ...acc,
        [item.status]: item._count._all,
      }), {}),
      priorityDistribution: priorityDistribution.reduce((acc, item) => ({
        ...acc,
        [item.priority]: item._count._all,
      }), {}),
      completionTrend: trendData.map(item => ({
        date: item.date.toISOString().split('T')[0],
        count: Number(item.count),
      })),
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalTasks / pageSize),
        totalItems: totalTasks,
      },
    };
    
    return response;
  }

  /**
   * Get user mentions data
   */
  async getUserMentions(userId: string): Promise<UserMention[]> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    // Find all comments that mention this user
    const mentions = await this.prisma.comment.findMany({
      where: {
        content: { contains: `@${user.name}`, mode: 'insensitive' },
        resolved: false, // Only get unresolved mentions
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Format the response
    return mentions.map(mention => ({
      id: mention.id,
      text: mention.content,
      createdAt: mention.createdAt.toISOString(),
      taskId: mention.task.id,
      taskTitle: mention.task.title,
      authorId: mention.author.id,
      authorName: mention.author.name,
      resolved: false, // Since we filtered for unresolved mentions
    }));
  }

  /**
   * Resolve a user mention
   */
  async resolveUserMention(mentionId: string): Promise<boolean> {
    try {
      // Verify the mention exists
      const mention = await this.prisma.comment.findUnique({
        where: { id: mentionId },
      });
      
      if (!mention) {
        throw new NotFoundException(`Mention with ID ${mentionId} not found`);
      }
      
      // Update the mention as resolved
      await this.prisma.comment.update({
        where: { id: mentionId },
        data: { resolved: true },
      });
      
      return true;
    } catch (error) {
      // Log the error for debugging
      console.error(`Error resolving mention ${mentionId}:`, error);
      throw new Error(`Failed to resolve mention: ${error.message}`);
    }
  }

  /**
   * Calculate average completion time in days
   */
  private async calculateAverageCompletionTime(where: any): Promise<number> {
    const completedTasks = await this.prisma.task.findMany({
      where: {
        ...where,
        status: 'COMPLETED',
        completedAt: { not: null },
        createdAt: { not: null }
      },
      select: {
        createdAt: true,
        completedAt: true
      }
    });

    if (completedTasks.length === 0) {
      return 0;
    }

    const totalDays = completedTasks.reduce((sum, task) => {
      const createdAt = new Date(task.createdAt);
      const completedAt = new Date(task.completedAt);
      const diffTime = Math.abs(completedAt.getTime() - createdAt.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return sum + diffDays;
    }, 0);

    return totalDays / completedTasks.length;
  }

  /**
   * Get task status distribution
   */
  private async getStatusDistribution(where: any): Promise<Record<string, number>> {
    const statuses = await this.prisma.task.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true
      }
    });

    return statuses.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {});
  }

  /**
   * Get task priority distribution
   */
  private async getPriorityDistribution(where: any): Promise<Record<string, number>> {
    const priorities = await this.prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: {
        priority: true
      }
    });

    return priorities.reduce((acc, curr) => {
      acc[curr.priority] = curr._count.priority;
      return acc;
    }, {});
  }

  /**
   * Get completion trend for the last 6 weeks
   */
  private async getCompletionTrend(where: any): Promise<Array<{ date: string; count: number }>> {
    const now = new Date();
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(now.getDate() - 42); // 6 weeks * 7 days
    
    const completedTasks = await this.prisma.task.findMany({
      where: {
        ...where,
        status: 'COMPLETED',
        completedAt: {
          gte: sixWeeksAgo,
          lte: now
        }
      },
      select: {
        completedAt: true
      }
    });

    // Group by week
    const weeklyData = completedTasks.reduce((acc, task) => {
      const completedAt = new Date(task.completedAt);
      const weekStart = new Date(completedAt);
      weekStart.setDate(completedAt.getDate() - completedAt.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!acc[weekKey]) {
        acc[weekKey] = 0;
      }
      
      acc[weekKey]++;
      return acc;
    }, {});

    // Generate all weeks in the range
    const result = [];
    for (let i = 0; i < 6; i++) {
      const weekDate = new Date(now);
      weekDate.setDate(now.getDate() - (i * 7));
      weekDate.setDate(weekDate.getDate() - weekDate.getDay()); // Start of week
      weekDate.setHours(0, 0, 0, 0);
      
      const weekKey = weekDate.toISOString().split('T')[0];
      
      result.unshift({
        date: weekKey,
        count: weeklyData[weekKey] || 0
      });
    }

    return result;
  }

  /**
   * Get top contributors based on completed tasks
   */
  private async getTopContributors(where: any): Promise<Array<{ userId: string; userName: string; taskCount: number }>> {
    const completedTasks = await this.prisma.task.findMany({
      where: {
        ...where,
        status: 'COMPLETED'
      },
      include: {
        assignees: {
          include: {
            user: true
          }
        }
      }
    });

    // Count tasks per user
    const userTaskCount = {};
    const userNames = {};
    
    completedTasks.forEach(task => {
      task.assignees.forEach(assignee => {
        const userId = assignee.userId;
        
        if (!userTaskCount[userId]) {
          userTaskCount[userId] = 0;
          userNames[userId] = `${assignee.user.firstName} ${assignee.user.lastName}`;
        }
        
        userTaskCount[userId]++;
      });
    });

    // Convert to array and sort
    const contributors = Object.keys(userTaskCount).map(userId => ({
      userId,
      userName: userNames[userId],
      taskCount: userTaskCount[userId]
    }));

    return contributors.sort((a, b) => b.taskCount - a.taskCount).slice(0, 5);
  }
}
