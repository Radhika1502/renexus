import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';

type TimeRange = '7d' | '30d' | '90d' | 'custom';

class ReportQueryDto {
  projectId: string;
  startDate?: Date;
  endDate?: Date;
  timeRange?: TimeRange;
  userIds?: string[];
  statuses?: string[];
}

@ApiTags('reports')
@Controller('reports')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('task-completion')
  @ApiOperation({ summary: 'Get task completion report' })
  @ApiResponse({ status: 200, description: 'Returns task completion metrics' })
  async getTaskCompletionReport(@Query() query: ReportQueryDto) {
    return this.reportingService.getTaskCompletionReport({
      projectId: query.projectId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      timeRange: query.timeRange as TimeRange,
      userIds: query.userIds ? JSON.parse(query.userIds as any) : undefined,
      statuses: query.statuses ? JSON.parse(query.statuses as any) : undefined,
    });
  }

  @Get('workload')
  @ApiOperation({ summary: 'Get workload report' })
  @ApiResponse({ status: 200, description: 'Returns workload metrics' })
  async getWorkloadReport(@Query('projectId') projectId: string) {
    return this.reportingService.getWorkloadReport(projectId);
  }

  @Get('task-status')
  @ApiOperation({ summary: 'Get task status report' })
  @ApiResponse({ status: 200, description: 'Returns task status metrics' })
  async getTaskStatusReport(@Query('projectId') projectId: string) {
    return this.reportingService.getTaskStatusReport(projectId);
  }
}
