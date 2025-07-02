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

  @Get('tasks/status')
  @ApiOperation({ summary: 'Get task status summary' })
  @ApiQuery({ name: 'projectId', required: false })
  async getTaskStatusSummary(
    @Query('projectId') projectId?: string,
  ) {
    return this.dashboardService.getTaskStatusSummary(projectId);
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
}
