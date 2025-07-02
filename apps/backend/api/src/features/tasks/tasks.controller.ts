import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { TasksService } from './tasks.service';
import { TaskDependenciesService } from './task-dependencies.service';
import { TaskAttachmentsService } from './task-attachments.service';
import { TaskTimeTrackingService } from './task-time-tracking.service';
import { TaskTemplatesService } from './task-templates.service';
import * as path from 'path';
import { multerOptions } from '../../shared/multer-config';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly dependenciesService: TaskDependenciesService,
    private readonly attachmentsService: TaskAttachmentsService,
    private readonly timeTrackingService: TaskTimeTrackingService,
    private readonly templatesService: TaskTemplatesService,
  ) {}

  // Task CRUD operations
  @Get()
  async findAll(@Query('projectId') projectId?: string) {
    return this.tasksService.findAll(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  async create(@Body() createTaskDto: any) {
    return this.tasksService.create(createTaskDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: any) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    if (!body.status) {
      throw new BadRequestException('Status is required');
    }
    return this.tasksService.updateStatus(id, body.status);
  }

  // Task Dependencies
  @Get(':id/dependencies')
  async findDependencies(@Param('id') id: string) {
    return this.dependenciesService.findDependencies(id);
  }

  @Get(':id/dependents')
  async findDependents(@Param('id') id: string) {
    return this.dependenciesService.findDependents(id);
  }

  @Post(':id/dependencies')
  async addDependency(
    @Param('id') id: string,
    @Body() body: { dependsOnTaskId: string },
  ) {
    if (!body.dependsOnTaskId) {
      throw new BadRequestException('dependsOnTaskId is required');
    }
    return this.dependenciesService.addDependency(id, body.dependsOnTaskId);
  }

  @Delete('dependencies/:id')
  async removeDependency(@Param('id') id: string) {
    return this.dependenciesService.removeDependency(id);
  }

  @Get(':id/available-dependencies')
  async findAvailableDependencies(
    @Param('id') id: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.dependenciesService.findAvailableDependencies(id, projectId);
  }

  @Get(':id/check-circular-dependency')
  async checkCircularDependency(
    @Param('id') id: string,
    @Query('dependsOnTaskId') dependsOnTaskId: string,
  ) {
    if (!dependsOnTaskId) {
      throw new BadRequestException('dependsOnTaskId is required');
    }
    return this.dependenciesService.checkCircularDependency(id, dependsOnTaskId);
  }

  // Task Attachments
  @Post('attachments')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { taskId: string },
  ) {
    if (!body.taskId) {
      throw new BadRequestException('taskId is required');
    }
    
    if (!file) {
      throw new BadRequestException('File is required');
    }
    
    const attachment = await this.attachmentsService.addAttachment(body.taskId, file);
    
    // Return attachment with download URL for client convenience
    return {
      ...attachment,
      downloadUrl: this.attachmentsService.getDownloadUrl(attachment.id),
    };
  }

  @Get(':taskId/attachments')
  async getAttachments(@Param('taskId') taskId: string) {
    return this.attachmentsService.getAttachments(taskId);
  }

  @Get('attachments/:id')
  async getAttachment(@Param('id') id: string) {
    const attachment = await this.attachmentsService.getAttachment(id);
    return {
      ...attachment,
      downloadUrl: this.attachmentsService.getDownloadUrl(attachment.id),
    };
  }
  
  @Get('attachments/:id/download')
  async downloadAttachment(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const attachment = await this.attachmentsService.getAttachment(id);
    const fileStream = this.attachmentsService.getFileStream(attachment.path);
    
    res.set({
      'Content-Type': attachment.mimetype,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
      'Cache-Control': 'max-age=3600', // Cache for 1 hour
    });
    
    return new StreamableFile(fileStream);
  }

  @Delete('attachments/:id')
  async removeAttachment(@Param('id') id: string) {
    return this.attachmentsService.removeAttachment(id);
  }

  // Task Time Tracking
  @Get(':id/time-entries')
  async getTimeEntries(@Param('id') id: string) {
    return this.timeTrackingService.getTimeEntries(id);
  }

  @Post(':id/time-entries')
  async createTimeEntry(
    @Param('id') id: string,
    @Body() body: {
      userId: string;
      userName: string;
      startTime: string;
      endTime: string;
      duration: number;
      notes?: string;
    },
  ) {
    if (!body.userId || !body.userName || !body.startTime || !body.endTime || !body.duration) {
      throw new BadRequestException('Missing required time entry fields');
    }
    
    return this.timeTrackingService.createTimeEntry(
      id,
      body.userId,
      body.userName,
      {
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        duration: body.duration,
        notes: body.notes,
      },
    );
  }

  @Post(':id/time-entries/start')
  async startTimer(
    @Param('id') id: string,
    @Body() body: {
      userId: string;
      userName: string;
      startTime: string;
    },
  ) {
    if (!body.userId || !body.userName || !body.startTime) {
      throw new BadRequestException('Missing required fields');
    }
    
    return this.timeTrackingService.startTimer(
      id,
      body.userId,
      body.userName,
      new Date(body.startTime),
    );
  }

  @Post(':id/time-entries/stop')
  async stopTimer(
    @Param('id') id: string,
    @Body() body: {
      userId: string;
      endTime: string;
      duration: number;
      notes?: string;
    },
  ) {
    if (!body.userId || !body.endTime || body.duration === undefined) {
      throw new BadRequestException('Missing required fields');
    }
    
    return this.timeTrackingService.stopTimer(
      id,
      body.userId,
      new Date(body.endTime),
      body.duration,
      body.notes,
    );
  }

  @Get('time-entries/active')
  async getActiveTimer(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    
    return this.timeTrackingService.getActiveTimer(userId);
  }

  @Get('time-entries/user/:userId')
  async getUserTimeEntries(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeTrackingService.getUserTimeEntries(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('time-entries/reports/task/:id')
  async getTaskTimeReport(@Param('id') taskId: string) {
    return this.timeTrackingService.generateTaskTimeReport(taskId);
  }

  @Get('time-entries/reports/user/:userId')
  async getUserTimeReport(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeTrackingService.generateUserTimeReport(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Delete('time-entries/:id')
  async deleteTimeEntry(@Param('id') id: string) {
    return this.timeTrackingService.deleteTimeEntry(id);
  }
}

// Creating a separate controller for task templates
@Controller('task-templates')
export class TaskTemplatesController {
  constructor(private readonly templatesService: TaskTemplatesService) {}

  @Get()
  async findAll(@Query('projectId') projectId?: string) {
    return this.templatesService.findAll(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  async create(@Body() createTemplateDto: any) {
    return this.templatesService.create(createTemplateDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTemplateDto: any) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post(':id/create-task')
  async createTaskFromTemplate(
    @Param('id') id: string,
    @Body() body: { projectId?: string; customFields?: any },
  ) {
    return this.templatesService.createTaskFromTemplate(
      id,
      body.projectId,
      body.customFields,
    );
  }
}
