import { ApiProperty } from '@nestjs/swagger';

export class TimelineEventDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'Event type' })
  type: string;

  @ApiProperty({ description: 'Event title' })
  title: string;

  @ApiProperty({ description: 'Event description', required: false })
  description?: string;

  @ApiProperty({ description: 'Event date in ISO format' })
  date: string;

  @ApiProperty({ description: 'Entity ID (e.g., task ID)' })
  entityId: string;

  @ApiProperty({ description: 'Entity type (e.g., TASK)' })
  entityType: string;
  
  @ApiProperty({ description: 'Project ID associated with the event' })
  projectId: string;
  
  @ApiProperty({ description: 'Project name' })
  projectName: string;
}
