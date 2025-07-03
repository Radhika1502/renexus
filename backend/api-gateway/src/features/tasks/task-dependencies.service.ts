import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TaskDependenciesService {
  constructor(private prisma: PrismaService) {}

  async findDependencies(taskId: string) {
    // Find all dependencies where this task depends on other tasks
    const dependencies = await this.prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOnTask: true,
      },
    });

    return dependencies;
  }

  async findDependents(taskId: string) {
    // Find all tasks that depend on this task
    const dependents = await this.prisma.taskDependency.findMany({
      where: { dependsOnTaskId: taskId },
      include: {
        task: true,
      },
    });

    return dependents;
  }

  // Public method to check for circular dependency (for API use)
  async checkCircularDependency(taskId: string, dependsOnTaskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    const dependsOnTask = await this.prisma.task.findUnique({ where: { id: dependsOnTaskId } });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (!dependsOnTask) {
      throw new NotFoundException(`Dependent task with ID ${dependsOnTaskId} not found`);
    }

    const isCircular = await this.checkForCircularDependency(taskId, dependsOnTaskId);
    return { wouldCreateCircularDependency: isCircular };
  }

  // Check if adding a dependency would create a circular dependency
  private async checkForCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    // Check if dependsOnTask depends on task (direct circular dependency)
    const directCircular = await this.prisma.taskDependency.findFirst({
      where: {
        taskId: dependsOnTaskId,
        dependsOnTaskId: taskId,
      },
    });

    if (directCircular) {
      return true;
    }

    // Check for indirect circular dependencies using recursive approach
    const checked = new Set<string>();
    
    async function checkDependencyChain(service: PrismaService, currentTaskId: string, targetTaskId: string): Promise<boolean> {
      if (checked.has(currentTaskId)) {
        return false;
      }
      
      checked.add(currentTaskId);
      
      const dependencies = await service.TaskDependency.findMany({
        where: { taskId: currentTaskId },
        select: { dependsOnTaskId: true },
      });
      
      for (const dep of dependencies) {
        if (dep.dependsOnTaskId === targetTaskId) {
          return true;
        }
        
        if (await checkDependencyChain(service, dep.dependsOnTaskId, targetTaskId)) {
          return true;
        }
      }
      
      return false;
    }

    return await checkDependencyChain(this.prisma, dependsOnTaskId, taskId);
  }

  async addDependency(taskId: string, dependsOnTaskId: string) {
    // Check if the tasks exist
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    const dependsOnTask = await this.prisma.task.findUnique({ where: { id: dependsOnTaskId } });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (!dependsOnTask) {
      throw new NotFoundException(`Dependent task with ID ${dependsOnTaskId} not found`);
    }

    // Check if the dependency already exists
    const existingDependency = await this.prisma.taskDependency.findFirst({
      where: {
        taskId,
        dependsOnTaskId,
      },
    });

    if (existingDependency) {
      throw new BadRequestException('This dependency already exists');
    }

    // Check for circular dependencies
    const isCircular = await this.checkForCircularDependency(taskId, dependsOnTaskId);
    if (isCircular) {
      throw new BadRequestException('Cannot add dependency as it would create a circular dependency');
    }

    // Create the dependency
    return this.prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId,
      },
      include: {
        dependsOnTask: true,
      },
    });
  }

  async removeDependency(dependencyId: string) {
    try {
      return await this.prisma.taskDependency.delete({
        where: { id: dependencyId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Dependency with ID ${dependencyId} not found`);
      }
      throw error;
    }
  }

  async findAvailableDependencies(taskId: string, projectId?: string) {
    // Get all tasks that can potentially be dependencies
    // Excluding the current task and any tasks that already depend on this task
    // to avoid circular dependencies

    // First, find all tasks that this task already depends on
    const existingDependencies = await this.prisma.taskDependency.findMany({
      where: { taskId },
      select: { dependsOnTaskId: true },
    });

    // Also find all tasks that depend on this task (directly or indirectly)
    // to avoid circular dependencies
    const dependentTaskIds = new Set<string>();
    dependentTaskIds.add(taskId); // Add the task itself
    
    // Get direct dependents
    const directDependents = await this.prisma.taskDependency.findMany({
      where: { dependsOnTaskId: taskId },
      select: { taskId: true },
    });
    
    directDependents.forEach((dep: { taskId: string }) => dependentTaskIds.add(dep.taskId));

    // Get existing dependency IDs
    const existingDependencyIds = existingDependencies.map((dep: { dependsOnTaskId: string }) => dep.dependsOnTaskId);
    
    // Find all available tasks
    const filter: any = {
      id: { 
        notIn: [...dependentTaskIds, ...existingDependencyIds] 
      }
    };

    // Filter by project if projectId is provided
    if (projectId) {
      filter.projectId = projectId;
    }

    return this.prisma.task.findMany({
      where: filter,
      select: {
        id: true,
        title: true,
        status: true,
      },
    });
  }
}
