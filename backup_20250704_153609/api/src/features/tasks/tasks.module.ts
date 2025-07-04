import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskDependenciesService } from './task-dependencies.service';
import { TaskAttachmentsService } from './task-attachments.service';
import { TaskTimeTrackingService } from './task-time-tracking.service';
import { TaskTemplatesService } from './task-templates.service';
import { TaskOptimizationService } from './task-optimization.service';
import { TaskOptimizationController } from './task-optimization.controller';
import { PrismaService } from '../../prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads');
          // Create directory if it doesn't exist
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Generate unique filename with original extension
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  ],
  controllers: [TasksController, TaskOptimizationController],
  providers: [
    TasksService,
    TaskDependenciesService,
    TaskAttachmentsService,
    TaskTimeTrackingService,
    TaskTemplatesService,
    TaskOptimizationService,
    PrismaService,
  ],
  exports: [
    TasksService,
    TaskDependenciesService,
    TaskAttachmentsService,
    TaskOptimizationService,
    TaskTimeTrackingService,
    TaskTemplatesService,
  ],
})
export class TasksModule {}
