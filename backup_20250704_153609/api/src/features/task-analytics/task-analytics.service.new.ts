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
  async getTaskAnalytics(filters: TaskAnalyticsFilters = {}): Promise<TaskAnalyticsResponse> {
    const { projectId, startDate, endDate, userId, status } = filters;
    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 10, 100);
    
    // Validate page and pageSize
    if (page < 1 || pageSize < 1) {
      throw new BadRequestException('Invalid pagination parameters. Page and pageSize must be >= 1.');
    }
    
    // Build where clause based on filters
    const where: any = {};
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (userId) {
      where.assignees = {
        some: { userId }
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
    
    // Calculate pagination
    const skip = (page - 1) * pageSize;
    
    // Get total count for pagination
    const totalTasks = await this.prisma.task.count({ where });
    
    // Calculate metrics
    const [completedTasks, overdueTasks, tasksWithoutAssignee] = await Promise.all([
      this.prisma.task.count({ where: { ...where, status: 'DONE' } }),
      this.prisma.task.count({
        where: {
          ...where,
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
        },
      }),
      this.prisma.task.count({
        where: { ...where, assignees: { none: {} } },
      }),
    ]);

    // Get status and priority distributions
    const [statusDistribution, priorityDistribution] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        _count: { _all: true },
        where,
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        _count: { _all: true },
        where,
      }),
    ]);

    // Format the response
    return {
      metrics: {
        totalTasks,
        completedTasks,
        overdueTasks,
        tasksWithoutAssignee,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        avgCompletionTime: 0, // Will be implemented in a separate method
      },
      statusDistribution: statusDistribution.reduce((acc, item) => ({
        ...acc,
        [item.status]: item._count._all,
      }), {}),
      priorityDistribution: priorityDistribution.reduce((acc, item) => ({
        ...acc,
        [item.priority]: item._count._all,
      }), {}),
      completionTrend: [], // Will be implemented in a separate method
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalTasks / pageSize),
        totalItems: totalTasks,
      },
    };
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
          select: { id: true, title: true },
        },
        author: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
}
