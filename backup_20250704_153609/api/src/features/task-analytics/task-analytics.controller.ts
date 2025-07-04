import { Controller, Get, Post, Query, Param, Body, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { TaskAnalyticsService } from './task-analytics.service';
import { TaskAnalyticsFilters } from '../../shared/types/task-analytics';

@Controller('analytics')
@UseInterceptors(CacheInterceptor)
export class TaskAnalyticsController {
  constructor(private taskAnalyticsService: TaskAnalyticsService) {}

  @Get('tasks')
  async getTaskAnalytics(@Query() filters: TaskAnalyticsFilters) {
    return this.taskAnalyticsService.getTaskAnalytics(filters);
  }

  @Get('tasks/:taskId')
  async getSingleTaskAnalytics(@Param('taskId') taskId: string) {
    // This endpoint is for single task analytics
    // We'll implement it to maintain backward compatibility
    return this.taskAnalyticsService.getTaskAnalytics({ taskId });
  }

  @Get('mentions/:userId')
  async getUserMentions(@Param('userId') userId: string) {
    return this.taskAnalyticsService.getUserMentions(userId);
  }

  @Post('mentions/:mentionId/resolve')
  async resolveUserMention(@Param('mentionId') mentionId: string) {
    const success = await this.taskAnalyticsService.resolveUserMention(mentionId);
    return { success: success }; // Added a colon after success to fix the syntax error
  }
}
