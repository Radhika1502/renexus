import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId?: string) {
    const options: any = {
      include: {
        attachments: true,
      } as any,
    };
    
    if (projectId) {
      options.where = { projectId };
    }
    
    return this.prisma.task.findMany(options);
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        attachments: true,
      } as any,
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(data: Prisma.TaskCreateInput) {
    return this.prisma.task.create({
      data,
      include: {
        attachments: true,
      } as any,
    });
  }

  async update(id: string, data: Prisma.TaskUpdateInput) {
    try {
      return await this.prisma.task.update({
        where: { id },
        data,
        include: {
          attachments: true,
        } as any,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.task.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: string) {
    return this.update(id, { status });
  }
}
