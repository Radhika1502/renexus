import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { TaskAnalyticsFilters, TaskAnalyticsResponse, UserMention } from '../../shared/types/task-analytics';

@Injectable()
export class TaskAnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get comprehensive task analytics data with optional filters
   */
  async getTaskAnalytics(filters?: TaskAnalyticsFilters): Promise<TaskAnalyticsResponse> {
    const { projectId, startDate, endDate, userId, status } = filters || {};
    
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
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get task metrics
    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksWithoutAssignee,
      avgCompletionTime
    ] = await Promise.all([
      // Total tasks count
      this.prisma.task.count({ where }),
      
      // Completed tasks count
      this.prisma.task.count({
        where: {
          ...where,
          status: 'COMPLETED'
        }
      }),
      
      // Overdue tasks count
      this.prisma.task.count({
        where: {
          ...where,
          dueDate: {
            lt: new Date()
          },
          status: {
            not: 'COMPLETED'
          }
        }
      }),
      
      // Tasks without assignee count
      this.prisma.task.count({
        where: {
          ...where,
          assignees: {
            none: {}
          }
        }
      }),
      
      // Average completion time (in days)
      this.calculateAverageCompletionTime(where)
    ]);

    // Get status distribution
    const statusDistribution = await this.getStatusDistribution(where);
    
    // Get priority distribution
    const priorityDistribution = await this.getPriorityDistribution(where);
    
    // Get completion trend (last 6 weeks)
    const completionTrend = await this.getCompletionTrend(where);
    
    // Get top contributors
    const topContributors = await this.getTopContributors(where);

    return {
      metrics: {
        totalTasks,
        completedTasks,
        overdueTasks,
        tasksWithoutAssignee,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        avgCompletionTime
      },
      statusDistribution,
      priorityDistribution,
      completionTrend,
      topContributors
    };
  }

  /**
   * Get user mentions data
   */
  async getUserMentions(userId: string): Promise<UserMention[]> {
    const mentions = await this.prisma.comment.findMany({
      where: {
        mentions: {
          some: {
            userId
          }
        },
        resolved: false
      },
      include: {
        task: true,
        author: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return mentions.map(mention => ({
      id: mention.id,
      text: mention.text,
      createdAt: mention.createdAt.toISOString(),
      taskId: mention.taskId,
      taskTitle: mention.task.title,
      authorId: mention.authorId,
      authorName: `${mention.author.firstName} ${mention.author.lastName}`,
      resolved: mention.resolved
    }));
  }

  /**
   * Mark a user mention as resolved
   */
  async resolveUserMention(mentionId: string): Promise<boolean> {
    try {
      await this.prisma.comment.update({
        where: { id: mentionId },
        data: { resolved: true }
      });
      
      return true;
    } catch (error) {
      console.error('Error resolving mention:', error);
      return false;
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
