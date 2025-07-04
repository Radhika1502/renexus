import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TaskOptimizationService } from './task-optimization.service';

@ApiTags('tasks')
@Controller('tasks/optimize')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TaskOptimizationController {
  constructor(private readonly taskOptimizationService: TaskOptimizationService) {}

  @Get('paginated')
  @ApiOperation({ summary: 'Get paginated tasks with optimized query' })
  @ApiResponse({ status: 200, description: 'Returns paginated tasks' })
  async getPaginatedTasks(
    @Query('projectId') projectId: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 50,
    @Query('cursor') cursor?: string
  ) {
    return this.taskOptimizationService.getPaginatedTasks(
      projectId,
      Number(page),
      Number(pageSize),
      cursor
    );
  }

  @Get('board-summary')
  @ApiOperation({ summary: 'Get task board summary without loading all tasks' })
  @ApiResponse({ status: 200, description: 'Returns board summary' })
  async getBoardSummary(@Query('projectId') projectId: string) {
    return this.taskOptimizationService.getBoardSummary(projectId);
  }
}
