import { ApiProperty } from '@nestjs/swagger';

export class TaskSummaryDto {
  @ApiProperty({ description: 'Total number of tasks' })
  total: number;

  @ApiProperty({ description: 'Number of active tasks' })
  active: number;

  @ApiProperty({ description: 'Number of completed tasks' })
  completed: number;

  @ApiProperty({ description: 'Number of tasks with upcoming deadlines' })
  upcomingDeadlines: number;
}

export class ProjectSummaryDto {
  @ApiProperty({ description: 'Total number of projects' })
  total: number;

  @ApiProperty({ description: 'Number of active projects' })
  active: number;
}

export class UserSummaryDto {
  @ApiProperty({ description: 'Total number of users' })
  total: number;
}

export class DashboardSummaryDto {
  @ApiProperty({ description: 'Task summary statistics' })
  tasks: TaskSummaryDto;

  @ApiProperty({ description: 'Project summary statistics' })
  projects: ProjectSummaryDto;

  @ApiProperty({ description: 'User summary statistics' })
  users: UserSummaryDto;
}
