#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 FIXING CRITICAL TYPESCRIPT ERRORS');
console.log('=====================================\n');

const projectRoot = process.cwd();

function createFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${filePath}`);
}

function runCommand(command, cwd = projectRoot) {
  console.log(`🔧 Running: ${command}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      shell: true 
    });
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// 1. Fix CacheInterceptor import in task-analytics.controller.ts
const taskAnalyticsControllerPath = path.join(projectRoot, 'src/features/task-analytics/task-analytics.controller.ts');
const fixedTaskAnalyticsController = `import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { TaskAnalyticsService } from './task-analytics.service';

@Controller('task-analytics')
@UseInterceptors(CacheInterceptor)
export class TaskAnalyticsController {
  constructor(private readonly taskAnalyticsService: TaskAnalyticsService) {}

  @Get('completion-rate')
  async getCompletionRate() {
    return this.taskAnalyticsService.getCompletionRate();
  }

  @Get('status-distribution')
  async getStatusDistribution() {
    return this.taskAnalyticsService.getStatusDistribution();
  }

  @Get('priority-breakdown')
  async getPriorityBreakdown() {
    return this.taskAnalyticsService.getPriorityBreakdown();
  }

  @Get('timeline')
  async getTimeline() {
    return this.taskAnalyticsService.getTimeline();
  }

  @Get('team-performance')
  async getTeamPerformance() {
    return this.taskAnalyticsService.getTeamPerformance();
  }

  @Get('overdue-tasks')
  async getOverdueTasks() {
    return this.taskAnalyticsService.getOverdueTasks();
  }

  @Get('velocity')
  async getVelocity() {
    return this.taskAnalyticsService.getVelocity();
  }
}
`;

// 2. Fix TaskDependency case issues in task-dependencies.service.ts
const taskDependenciesServicePath = path.join(projectRoot, 'src/features/tasks/task-dependencies.service.ts');
if (fs.existsSync(taskDependenciesServicePath)) {
  let content = fs.readFileSync(taskDependenciesServicePath, 'utf8');
  content = content.replace(/this\.prisma\.TaskDependency/g, 'this.prisma.taskDependency');
  createFile(taskDependenciesServicePath, content);
}

// 3. Fix task-templates.service.ts
const taskTemplatesServicePath = path.join(projectRoot, 'src/features/tasks/task-templates.service.ts');
const fixedTaskTemplatesService = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TaskTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId?: string) {
    const where = projectId ? { projectId } : {};
    return this.prisma.taskTemplate.findMany({ where });
  }

  async findOne(id: string) {
    return this.prisma.taskTemplate.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.taskTemplate.create({
      data: {
        ...data,
        fields: typeof data.fields === 'object' ? JSON.stringify(data.fields) : data.fields,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.taskTemplate.update({
      where: { id },
      data: {
        ...data,
        fields: typeof data.fields === 'object' ? JSON.stringify(data.fields) : data.fields,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.taskTemplate.delete({
      where: { id },
    });
  }

  async createFromTemplate(templateId: string, taskData: any) {
    const template = await this.findOne(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const fields = typeof template.fields === 'string' 
      ? JSON.parse(template.fields) 
      : template.fields;

    return {
      ...template,
      ...taskData,
      fields,
      createdFromTemplate: true,
    };
  }
}
`;

// 4. Create missing shared types
const sharedTypesPath = path.join(projectRoot, 'src/shared/types/models.ts');
const sharedTypesContent = `export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  estimatedHours?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  assigneeId?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tasks?: Task[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  assignedTasks?: Task[];
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  createdAt: Date;
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
`;

// 5. Create shared logger utility
const loggerPath = path.join(projectRoot, 'src/shared/utils/logger.ts');
const loggerContent = `import { Logger } from '@nestjs/common';

export const logger = new Logger('App');

export function createLogger(context: string) {
  return new Logger(context);
}
`;

// 6. Fix security middleware
const securityMiddlewarePath = path.join(projectRoot, 'src/security/security.middleware.ts');
const fixedSecurityMiddleware = `import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as helmet from 'helmet';
import rateLimit from 'express-rate-limit';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Apply rate limiting
    this.rateLimiter(req, res, (err?: any) => {
      if (err) {
        return next(err);
      }
      
      // Apply helmet security headers
      helmet()(req, res, next);
    });
  }
}
`;

// 7. Fix WebSocket exports
const websocketIndexPath = path.join(projectRoot, 'src/websocket/index.ts');
const fixedWebsocketIndex = `export { default as WebSocketServer } from './WebSocketServer';
export * from './types';
`;

// Apply all fixes
console.log('Applying fixes...\n');

createFile(taskAnalyticsControllerPath, fixedTaskAnalyticsController);
createFile(taskTemplatesServicePath, fixedTaskTemplatesService);
createFile(sharedTypesPath, sharedTypesContent);
createFile(loggerPath, loggerContent);
createFile(securityMiddlewarePath, fixedSecurityMiddleware);
createFile(websocketIndexPath, fixedWebsocketIndex);

// 8. Install missing dependencies
console.log('\n📦 Installing missing dependencies...');
const missingDeps = [
  '@types/hpp',
  '@types/express-rate-limit',
  'xss-clean',
  '@types/xss-clean'
];

for (const dep of missingDeps) {
  runCommand(`npm install --save-dev ${dep}`);
}

console.log('\n✅ All critical fixes applied!');
console.log('🔧 Now trying to start the server...\n');

// Try to start the server
runCommand('npm run start:dev'); 