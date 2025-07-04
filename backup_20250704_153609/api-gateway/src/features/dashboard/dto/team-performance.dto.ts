import { ApiProperty } from '@nestjs/swagger';

export class TeamPerformanceDto {
  @ApiProperty({ description: 'Team ID' })
  teamId: string;

  @ApiProperty({ description: 'Team name' })
  teamName: string;

  @ApiProperty({ description: 'Task completion rate (0-1)' })
  completionRate: number;

  @ApiProperty({ description: 'Total number of tasks' })
  totalTasks: number;

  @ApiProperty({ description: 'Number of completed tasks' })
  completedTasks: number;

  @ApiProperty({ description: 'Average task completion time in hours' })
  averageTaskCompletionTime: number;

  @ApiProperty({ description: 'On-time delivery rate (0-1)' })
  onTimeDeliveryRate: number;
}
