import { ApiProperty } from '@nestjs/swagger';

export class TaskStatusSummaryDto {
  @ApiProperty({ description: 'Task status' })
  status: string;

  @ApiProperty({ description: 'Number of tasks with this status' })
  count: number;
  
  @ApiProperty({ description: 'Percentage of tasks with this status (0-100)' })
  percentage: number;
}
