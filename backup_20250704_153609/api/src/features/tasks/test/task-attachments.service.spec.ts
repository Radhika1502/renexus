import { Test, TestingModule } from '@nestjs/testing';
import { TaskAttachmentsService } from '../task-attachments.service';
import { PrismaService } from '../../../prisma.service';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Mock the fs module
jest.mock('fs', () => ({
  unlinkSync: jest.fn(),
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
  promises: {
    unlink: jest.fn(),
  },
}));

describe('TaskAttachmentsService', () => {
  let service: TaskAttachmentsService;
  let prismaService: PrismaService;

  // Mock data
  const mockTask = { id: 'task1', title: 'Sample Task' };
  
  const mockAttachment = {
    id: 'attachment1',
    taskId: 'task1',
    filename: 'test-file.pdf',
    path: '/uploads/test-file.pdf',
    mimetype: 'application/pdf',
    size: 12345,
  };
  
  const mockFile = {
    fieldname: 'file',
    originalname: 'test-file.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 12345,
    destination: '/uploads',
    filename: 'unique-id-test-file.pdf',
    path: '/uploads/unique-id-test-file.pdf',
    buffer: Buffer.from('test file content'),
  };

  // Create a mock Prisma service
  const mockPrismaService = {
    task: {
      findUnique: jest.fn(),
    },
    taskAttachment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskAttachmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TaskAttachmentsService>(TaskAttachmentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    
    // Reset mock implementations
    jest.clearAllMocks();
    
    // Default implementation for fs.existsSync
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Default implementation for fs.createReadStream
    (fs.createReadStream as jest.Mock).mockReturnValue({ pipe: jest.fn() });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addAttachment', () => {
    it('should add an attachment to a task', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.taskAttachment.create.mockResolvedValue({
        id: 'new-attachment',
        ...mockFile,
        taskId: 'task1',
      });

      const result = await service.addAttachment('task1', mockFile as any);
      
      expect(result).toHaveProperty('id', 'new-attachment');
      expect(result).toHaveProperty('taskId', 'task1');
      expect(mockPrismaService.taskAttachment.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task1',
          filename: mockFile.originalname,
          path: mockFile.path,
          mimetype: mockFile.mimetype,
          size: mockFile.size,
        },
      });
    });

    it('should throw BadRequestException if file is too large', async () => {
      const largeFile = {
        ...mockFile,
        size: 20 * 1024 * 1024, // 20MB (over the 10MB limit)
      };

      await expect(service.addAttachment('task1', largeFile as any)).rejects.toThrow(
        BadRequestException,
      );
      
      // Should attempt to delete the file
      expect(fs.unlinkSync).toHaveBeenCalledWith(largeFile.path);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.addAttachment('nonexistent', mockFile as any)).rejects.toThrow(
        NotFoundException,
      );
      
      // Should attempt to delete the file
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockFile.path);
    });

    it('should delete file and throw error if database operation fails', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.taskAttachment.create.mockRejectedValue(new Error('Database error'));

      await expect(service.addAttachment('task1', mockFile as any)).rejects.toThrow(
        InternalServerErrorException,
      );
      
      // Should attempt to delete the file
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockFile.path);
    });
  });

  describe('getAttachments', () => {
    it('should return all attachments for a task', async () => {
      mockPrismaService.taskAttachment.findMany.mockResolvedValue([mockAttachment]);

      const result = await service.getAttachments('task1');
      
      expect(result).toEqual([mockAttachment]);
      expect(mockPrismaService.taskAttachment.findMany).toHaveBeenCalledWith({
        where: { taskId: 'task1' },
      });
    });
  });

  describe('getAttachment', () => {
    it('should return a specific attachment', async () => {
      mockPrismaService.taskAttachment.findUnique.mockResolvedValue(mockAttachment);

      const result = await service.getAttachment('attachment1');
      
      expect(result).toEqual(mockAttachment);
      expect(mockPrismaService.taskAttachment.findUnique).toHaveBeenCalledWith({
        where: { id: 'attachment1' },
      });
    });

    it('should throw NotFoundException if attachment does not exist', async () => {
      mockPrismaService.taskAttachment.findUnique.mockResolvedValue(null);

      await expect(service.getAttachment('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeAttachment', () => {
    it('should remove an attachment', async () => {
      mockPrismaService.taskAttachment.findUnique.mockResolvedValue(mockAttachment);
      mockPrismaService.taskAttachment.delete.mockResolvedValue(mockAttachment);

      const result = await service.removeAttachment('attachment1');
      
      expect(result).toEqual({
        id: 'attachment1',
        deleted: true,
      });
      
      // Should attempt to delete the file
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockAttachment.path);
    });

    it('should throw NotFoundException if attachment does not exist', async () => {
      mockPrismaService.taskAttachment.findUnique.mockResolvedValue(null);

      await expect(service.removeAttachment('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle file deletion errors gracefully', async () => {
      mockPrismaService.taskAttachment.findUnique.mockResolvedValue(mockAttachment);
      mockPrismaService.taskAttachment.delete.mockResolvedValue(mockAttachment);
      
      // Mock fs.unlinkSync to throw an error
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = await service.removeAttachment('attachment1');
      
      // Should still report success since DB record was deleted
      expect(result).toEqual({
        id: 'attachment1',
        deleted: true,
      });
      
      // Should have attempted to delete the file
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockAttachment.path);
    });

    it('should throw InternalServerErrorException if database operation fails', async () => {
      mockPrismaService.taskAttachment.findUnique.mockResolvedValue(mockAttachment);
      mockPrismaService.taskAttachment.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.removeAttachment('attachment1')).rejects.toThrow(
        InternalServerErrorException,
      );
      
      // Should NOT attempt to delete the file if DB operation fails
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('getFileStream', () => {
    it('should return a readable stream for a file', () => {
      const mockStream = { pipe: jest.fn() };
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const result = service.getFileStream('/uploads/test-file.pdf');
      
      expect(result).toBe(mockStream);
      expect(fs.createReadStream).toHaveBeenCalledWith('/uploads/test-file.pdf');
    });

    it('should throw NotFoundException if file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      expect(() => service.getFileStream('/uploads/nonexistent.pdf')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDownloadUrl', () => {
    it('should return the correct download URL for an attachment', () => {
      const url = service.getDownloadUrl('attachment1');
      expect(url).toBe('/api/tasks/attachments/attachment1/download');
    });
  });
});
