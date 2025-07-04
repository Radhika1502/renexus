import { Controller, Get, Query, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TimeRangeDto } from './dto/time-range.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary statistics' })
  async getDashboardSummary() {
    return this.dashboardService.getDashboardSummary();
  }

  @Get('projects')
  @ApiOperation({ summary: 'Get project summaries for dashboard' })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  async getProjectSummaries(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const timeRange = start && end ? { start, end } : undefined;
    return this.dashboardService.getProjectSummaries(timeRange);
  }

  @Get('tasks/status')
  @ApiOperation({ summary: 'Get task status summary' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  async getTaskStatusSummary(
    @Query('projectId') projectId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const timeRange = start && end ? { start, end } : undefined;
    return this.dashboardService.getTaskStatusSummary(projectId, timeRange);
  }

  @Get('teams/performance')
  @ApiOperation({ summary: 'Get team performance metrics' })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  async getTeamPerformance(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const timeRange = start && end ? { start, end } : undefined;
    return this.dashboardService.getTeamPerformance(timeRange);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get timeline events' })
  @ApiQuery({ name: 'start', required: false })
  @ApiQuery({ name: 'end', required: false })
  async getTimelineEvents(
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const timeRange = start && end ? { start, end } : undefined;
    return this.dashboardService.getTimelineEvents(timeRange);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get activity feed for dashboard' })
  @ApiQuery({ name: 'limit', required: false })
  async getActivityFeed(
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getActivityFeed(limitNumber);
  }
}
