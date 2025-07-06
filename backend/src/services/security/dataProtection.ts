import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

export class DataProtectionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12; // 96 bits for GCM
  private readonly tagLength = 16; // 128 bits for authentication tag
  private readonly encryptionKey: Buffer;

  constructor(
    private prisma: PrismaClient,
    encryptionKey?: string
  ) {
    // Use provided key or generate a new one
    this.encryptionKey = encryptionKey
      ? Buffer.from(encryptionKey, 'hex')
      : crypto.randomBytes(this.keyLength);
  }

  // Encrypt sensitive data
  public encrypt(data: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
      { authTagLength: this.tagLength }
    );

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Combine IV, encrypted data, and auth tag
    return Buffer.concat([iv, encrypted, tag]).toString('hex');
  }

  // Decrypt sensitive data
  public decrypt(encryptedData: string): string {
    const buffer = Buffer.from(encryptedData, 'hex');

    // Extract IV, encrypted data, and auth tag
    const iv = buffer.subarray(0, this.ivLength);
    const tag = buffer.subarray(buffer.length - this.tagLength);
    const encrypted = buffer.subarray(
      this.ivLength,
      buffer.length - this.tagLength
    );

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
      { authTagLength: this.tagLength }
    );

    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }

  // Log security audit event
  public async logAuditEvent(data: {
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      },
    });
  }

  // Get audit logs with filtering
  public async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20, ...where } = filters;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pageSize,
      hasMore: total > page * pageSize,
    };
  }

  // Implement data retention policy
  public async applyRetentionPolicy(retentionDays: number) {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    // Delete audit logs older than retention period
    await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: retentionDate,
        },
      },
    });

    // Archive sensitive data older than retention period
    // This would be implemented based on specific requirements
    // For example, moving to cold storage or applying additional encryption
  }

  // Rotate encryption keys
  public async rotateEncryptionKey(): Promise<void> {
    const newKey = crypto.randomBytes(this.keyLength);
    
    // In a real implementation, this would:
    // 1. Generate new key
    // 2. Re-encrypt all sensitive data with new key
    // 3. Update key in secure storage
    // 4. Securely delete old key
    
    throw new Error('Key rotation not implemented');
  }

  // Hash sensitive data (e.g., for searching encrypted data)
  public hashData(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  // Validate data access
  public async validateDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    // This would implement your data access policies
    // For example, checking user permissions, roles, etc.
    // Return true if access is allowed, false otherwise
    return true;
  }
} 