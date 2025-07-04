import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { UPLOAD_DIR } from '../../shared/multer-config';

// Define the Express.Multer.File interface
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

@Injectable()
export class TaskAttachmentsService {
  constructor(private prisma: PrismaService) {}

  async addAttachment(taskId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    
    // Validate file size (redundant with multer but good practice)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      // Clean up the file
      this.deleteFile(file.path);
      throw new BadRequestException(`File too large. Maximum size is ${MAX_SIZE / (1024 * 1024)}MB`);
    }

    // Check if task exists
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      // Delete the uploaded file if the task doesn't exist
      this.deleteFile(file.path);
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    try {
      // Create attachment record
      return await this.prisma.taskAttachment.create({
        data: {
          taskId,
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
        },
      });
    } catch (error) {
      // Clean up the file if database operation fails
      this.deleteFile(file.path);
      throw new InternalServerErrorException('Failed to save attachment information');
    }
  }

  async getAttachments(taskId: string) {
    return this.prisma.taskAttachment.findMany({
      where: { taskId },
    });
  }

  async getAttachment(id: string) {
    const attachment = await this.prisma.taskAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    return attachment;
  }

  async removeAttachment(id: string) {
    // Find attachment first to get the file path
    const attachment = await this.prisma.taskAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${id} not found`);
    }

    try {
      // Delete from database first
      await this.prisma.taskAttachment.delete({
        where: { id },
      });
      
      // Then delete file from filesystem
      this.deleteFile(attachment.path);
      
      return { id, deleted: true };
    } catch (error) {
      // If database deletion fails, don't delete the file
      throw new InternalServerErrorException('Failed to remove attachment');
    }
  }

  // Helper method to get file stream for download
  getFileStream(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return fs.createReadStream(filePath);
  }

  // Helper method to safely delete a file
  private deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }
  
  // Generate a download URL for client-side use
  getDownloadUrl(attachmentId: string): string {
    return `/api/tasks/attachments/${attachmentId}/download`;
  }
}
