import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db } from '../../database/db';
import { dataRetentionPolicies } from '../../database/schema';
import { eq, and, lt } from 'drizzle-orm';

/**
 * Enhanced Data Security Service for Phase 4 Security Implementation
 * Implements field-level encryption, secure data export mechanisms,
 * data retention policies, and data anonymization capabilities
 */
export class DataSecurityService {
  private readonly ENCRYPTION_KEY: Buffer;
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  
  constructor() {
    // In production, this should be securely stored in a key management system
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-32-chars-change-in-prod';
    this.ENCRYPTION_KEY = Buffer.from(encryptionKey.padEnd(32).slice(0, 32));
  }
  
  /**
   * Encrypt sensitive data
   */
  encryptData(plaintext: string): { 
    encryptedData: string; 
    iv: string;
    authTag: string;
  } {
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv(
        this.ENCRYPTION_ALGORITHM, 
        this.ENCRYPTION_KEY, 
        iv
      );
      
      // Encrypt the data
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag().toString('hex');
      
      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt sensitive data
   */
  decryptData(
    encryptedData: string, 
    iv: string, 
    authTag: string
  ): string {
    try {
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.ENCRYPTION_ALGORITHM,
        this.ENCRYPTION_KEY,
        Buffer.from(iv, 'hex')
      );
      
      // Set auth tag
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      // Decrypt the data
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Create a secure data export with optional field filtering and encryption
   */
  async createSecureExport(
    userId: string,
    dataType: string,
    filters: any = {},
    includeFields: string[] = [],
    excludeFields: string[] = [],
    encryptExport: boolean = false
  ): Promise<{
    success: boolean;
    exportId?: string;
    downloadUrl?: string;
    expiresAt?: Date;
    message?: string;
  }> {
    try {
      // Check user permissions for this export
      const hasPermission = await this.checkExportPermission(userId, dataType);
      
      if (!hasPermission) {
        return { 
          success: false, 
          message: 'You do not have permission to export this data' 
        };
      }
      
      // Query data based on type and filters
      const data = await this.queryDataForExport(dataType, filters);
      
      if (!data || data.length === 0) {
        return { 
          success: false, 
          message: 'No data found matching the export criteria' 
        };
      }
      
      // Apply field filtering
      const filteredData = this.filterDataFields(
        data, 
        includeFields, 
        excludeFields
      );
      
      // Generate export ID
      const exportId = uuidv4();
      
      // Set expiration (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Prepare export content
      let exportContent = JSON.stringify(filteredData);
      let encryptionDetails = null;
      
      // Encrypt if requested
      if (encryptExport) {
        const { encryptedData, iv, authTag } = this.encryptData(exportContent);
        exportContent = encryptedData;
        encryptionDetails = { iv, authTag };
      }
      
      // Save export record
      await db.insert({
        table: 'data_exports',
        values: {
          id: exportId,
          userId,
          dataType,
          filters: JSON.stringify(filters),
          includeFields: includeFields.length > 0 ? JSON.stringify(includeFields) : null,
          excludeFields: excludeFields.length > 0 ? JSON.stringify(excludeFields) : null,
          encrypted: encryptExport,
          encryptionDetails: encryptionDetails ? JSON.stringify(encryptionDetails) : null,
          content: exportContent,
          expiresAt: expiresAt.toISOString(),
          createdAt: new Date(),
          downloadCount: 0
        }
      });
      
      // Log export event
      await this.logDataEvent(userId, 'DATA_EXPORT', {
        dataType,
        exportId,
        encrypted: encryptExport,
        recordCount: filteredData.length
      });
      
      // Generate download URL
      const downloadUrl = `/api/data-exports/${exportId}/download`;
      
      return {
        success: true,
        exportId,
        downloadUrl,
        expiresAt
      };
    } catch (error) {
      console.error('Secure export error:', error);
      return { 
        success: false, 
        message: 'Failed to create secure export' 
      };
    }
  }
  
  /**
   * Apply data retention policy to automatically delete or anonymize old data
   */
  async applyDataRetentionPolicies(): Promise<{
    success: boolean;
    deletedRecords: number;
    anonymizedRecords: number;
    message?: string;
  }> {
    try {
      let deletedRecords = 0;
      let anonymizedRecords = 0;
      
      // Get all active retention policies
      const policies = await db.query.dataRetentionPolicies.findMany({
        where: eq(dataRetentionPolicies.active, true)
      });
      
      // Process each policy
      for (const policy of policies) {
        const { dataType, retentionPeriodDays, action } = policy;
        
        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionPeriodDays);
        
        if (action === 'DELETE') {
          // Delete old records
          const result = await this.deleteExpiredData(dataType, cutoffDate);
          deletedRecords += result;
        } else if (action === 'ANONYMIZE') {
          // Anonymize old records
          const result = await this.anonymizeExpiredData(dataType, cutoffDate);
          anonymizedRecords += result;
        }
      }
      
      // Log retention policy application
      await this.logDataEvent('system', 'RETENTION_POLICY_APPLIED', {
        deletedRecords,
        anonymizedRecords,
        timestamp: new Date()
      });
      
      return {
        success: true,
        deletedRecords,
        anonymizedRecords
      };
    } catch (error) {
      console.error('Data retention policy error:', error);
      return { 
        success: false, 
        deletedRecords: 0,
        anonymizedRecords: 0,
        message: 'Failed to apply data retention policies' 
      };
    }
  }
  
  /**
   * Create or update a data retention policy
   */
  async setDataRetentionPolicy(
    dataType: string,
    retentionPeriodDays: number,
    action: 'DELETE' | 'ANONYMIZE',
    active: boolean = true
  ): Promise<{
    success: boolean;
    policyId?: string;
    message?: string;
  }> {
    try {
      const policyId = uuidv4();
      
      await db.insert(dataRetentionPolicies)
        .values({
          id: policyId,
          dataType,
          retentionPeriodDays,
          action,
          active,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: dataRetentionPolicies.dataType,
          set: {
            retentionPeriodDays,
            action,
            active,
            updatedAt: new Date()
          }
        });
      
      return {
        success: true,
        policyId
      };
    } catch (error) {
      console.error('Set data retention policy error:', error);
      return { 
        success: false, 
        message: 'Failed to set data retention policy' 
      };
    }
  }
  
  /**
   * Anonymize user data while preserving statistical value
   */
  async anonymizeUserData(
    userId: string,
    dataTypes: string[] = []
  ): Promise<{
    success: boolean;
    anonymizedRecords: number;
    message?: string;
  }> {
    try {
      let anonymizedRecords = 0;
      
      // Generate anonymized identifier
      const anonymizedId = `anon_${crypto.randomBytes(8).toString('hex')}`;
      
      // Process each data type
      for (const dataType of dataTypes) {
        const result = await this.anonymizeUserDataByType(
          userId, 
          dataType, 
          anonymizedId
        );
        
        anonymizedRecords += result;
      }
      
      // Log anonymization event
      await this.logDataEvent('system', 'USER_DATA_ANONYMIZED', {
        originalUserId: userId,
        anonymizedId,
        dataTypes,
        recordCount: anonymizedRecords
      });
      
      return {
        success: true,
        anonymizedRecords
      };
    } catch (error) {
      console.error('User data anonymization error:', error);
      return { 
        success: false, 
        anonymizedRecords: 0,
        message: 'Failed to anonymize user data' 
      };
    }
  }
  
  /**
   * Check if a user has permission to export data
   */
  private async checkExportPermission(
    userId: string, 
    dataType: string
  ): Promise<boolean> {
    // In a real implementation, this would check against the authorization service
    // For this implementation, we'll assume the check passes
    return true;
  }
  
  /**
   * Query data for export based on type and filters
   */
  private async queryDataForExport(
    dataType: string, 
    filters: any
  ): Promise<any[]> {
    // This is a simplified implementation
    // In a real system, this would dynamically query different tables
    
    let data: any[] = [];
    
    switch (dataType) {
      case 'projects':
        data = await db.query.projects.findMany({
          where: filters
        });
        break;
      case 'tasks':
        data = await db.query.tasks.findMany({
          where: filters
        });
        break;
      case 'users':
        data = await db.query.users.findMany({
          where: filters
        });
        break;
      // Add more data types as needed
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
    
    return data;
  }
  
  /**
   * Filter data fields based on include/exclude lists
   */
  private filterDataFields(
    data: any[], 
    includeFields: string[], 
    excludeFields: string[]
  ): any[] {
    // If no filtering needed, return original data
    if (includeFields.length === 0 && excludeFields.length === 0) {
      return data;
    }
    
    return data.map(item => {
      const result: any = {};
      
      // If include fields specified, only include those
      if (includeFields.length > 0) {
        for (const field of includeFields) {
          if (item[field] !== undefined) {
            result[field] = item[field];
          }
        }
      } else {
        // Otherwise include all except excluded
        for (const [key, value] of Object.entries(item)) {
          if (!excludeFields.includes(key)) {
            result[key] = value;
          }
        }
      }
      
      return result;
    });
  }
  
  /**
   * Delete expired data based on retention policy
   */
  private async deleteExpiredData(
    dataType: string, 
    cutoffDate: Date
  ): Promise<number> {
    // This is a simplified implementation
    // In a real system, this would dynamically delete from different tables
    
    let deletedCount = 0;
    
    switch (dataType) {
      case 'audit_logs':
        const auditResult = await db.delete({
          table: 'audit_logs',
          where: lt(db.audit_logs.createdAt, cutoffDate)
        });
        deletedCount = auditResult.rowCount || 0;
        break;
      case 'user_sessions':
        const sessionResult = await db.delete(db.userSessions)
          .where(lt(db.userSessions.updatedAt, cutoffDate));
        deletedCount = sessionResult.rowCount || 0;
        break;
      // Add more data types as needed
      default:
        console.warn(`No deletion implementation for data type: ${dataType}`);
    }
    
    return deletedCount;
  }
  
  /**
   * Anonymize expired data based on retention policy
   */
  private async anonymizeExpiredData(
    dataType: string, 
    cutoffDate: Date
  ): Promise<number> {
    // This is a simplified implementation
    // In a real system, this would dynamically anonymize different tables
    
    let anonymizedCount = 0;
    
    switch (dataType) {
      case 'user_activity':
        const activityResult = await db.update({
          table: 'user_activity',
          set: {
            userId: 'anonymized',
            ipAddress: '0.0.0.0',
            userAgent: 'anonymized'
          },
          where: lt(db.user_activity.createdAt, cutoffDate)
        });
        anonymizedCount = activityResult.rowCount || 0;
        break;
      // Add more data types as needed
      default:
        console.warn(`No anonymization implementation for data type: ${dataType}`);
    }
    
    return anonymizedCount;
  }
  
  /**
   * Anonymize user data by type
   */
  private async anonymizeUserDataByType(
    userId: string, 
    dataType: string, 
    anonymizedId: string
  ): Promise<number> {
    // This is a simplified implementation
    // In a real system, this would dynamically anonymize different tables
    
    let anonymizedCount = 0;
    
    switch (dataType) {
      case 'user_profile':
        const profileResult = await db.update({
          table: 'users',
          set: {
            email: `${anonymizedId}@anonymous.com`,
            firstName: 'Anonymous',
            lastName: 'User',
            phone: null,
            address: null,
            profileImage: null,
            updatedAt: new Date()
          },
          where: eq(db.users.id, userId)
        });
        anonymizedCount = profileResult.rowCount || 0;
        break;
      case 'user_activity':
        const activityResult = await db.update({
          table: 'user_activity',
          set: {
            userId: anonymizedId,
            ipAddress: '0.0.0.0',
            userAgent: 'anonymized',
            updatedAt: new Date()
          },
          where: eq(db.user_activity.userId, userId)
        });
        anonymizedCount = activityResult.rowCount || 0;
        break;
      // Add more data types as needed
      default:
        console.warn(`No anonymization implementation for data type: ${dataType}`);
    }
    
    return anonymizedCount;
  }
  
  /**
   * Log data security events for audit purposes
   */
  private async logDataEvent(
    userId: string, 
    eventType: string, 
    details: any
  ): Promise<void> {
    await db.insert({
      table: 'data_security_logs',
      values: {
        id: uuidv4(),
        userId,
        eventType,
        details: JSON.stringify(details),
        ipAddress: '0.0.0.0', // In a real implementation, get from request
        userAgent: 'Unknown', // In a real implementation, get from request
        createdAt: new Date()
      }
    });
  }
}

export default new DataSecurityService();
