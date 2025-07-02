import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { roles, permissions, rolePermissions, resourcePermissions, users } from '../../database/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Enhanced Authorization Service for Phase 4 Security Implementation
 * Implements role-based access control, resource-level permissions,
 * permission inheritance, and audit logging for access events
 */
export class AuthorizationService {
  /**
   * Check if a user has permission to perform an action on a resource
   */
  async hasPermission(
    userId: string,
    permissionName: string,
    resourceType?: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      // Get user with role
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
          role: true
        }
      });

      if (!user || !user.role) {
        return false;
      }

      // Check if user has direct permission override
      const userDirectPermission = await db.query.userPermissions.findFirst({
        where: and(
          eq(permissions.name, permissionName),
          eq(permissions.userId, userId)
        )
      });

      // If user has direct permission, it overrides role permissions
      if (userDirectPermission) {
        return userDirectPermission.granted;
      }

      // Get all permissions for the user's role
      const rolePermissionsList = await db.query.rolePermissions.findMany({
        where: eq(rolePermissions.roleId, user.role.id),
        with: {
          permission: true
        }
      });

      // Check if role has the required permission
      const hasRolePermission = rolePermissionsList.some(
        rp => rp.permission.name === permissionName
      );

      if (!hasRolePermission) {
        return false;
      }

      // If no resource specified, role permission is sufficient
      if (!resourceType || !resourceId) {
        return true;
      }

      // Check resource-specific permissions
      const resourcePermission = await db.query.resourcePermissions.findFirst({
        where: and(
          eq(resourcePermissions.userId, userId),
          eq(resourcePermissions.resourceType, resourceType),
          eq(resourcePermissions.resourceId, resourceId),
          eq(resourcePermissions.permissionName, permissionName)
        )
      });

      // If resource permission exists, it overrides role permission
      if (resourcePermission) {
        return resourcePermission.granted;
      }

      // Check inherited permissions through resource hierarchy
      const hasInheritedPermission = await this.checkInheritedPermissions(
        userId,
        permissionName,
        resourceType,
        resourceId
      );

      if (hasInheritedPermission !== null) {
        return hasInheritedPermission;
      }

      // Default to role permission if no resource-specific override
      return true;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    } finally {
      // Log access attempt asynchronously (don't await)
      this.logAccessEvent(
        userId,
        permissionName,
        resourceType,
        resourceId
      ).catch(err => console.error('Failed to log access event:', err));
    }
  }

  /**
   * Check inherited permissions through resource hierarchy
   * For example, if a user has permission on a project, they might inherit
   * permissions on tasks within that project
   */
  private async checkInheritedPermissions(
    userId: string,
    permissionName: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean | null> {
    try {
      // Get resource hierarchy information
      const resourceHierarchy = await this.getResourceHierarchy(resourceType, resourceId);
      
      if (!resourceHierarchy || resourceHierarchy.length === 0) {
        return null;
      }

      // Check permissions on parent resources
      for (const parent of resourceHierarchy) {
        const parentPermission = await db.query.resourcePermissions.findFirst({
          where: and(
            eq(resourcePermissions.userId, userId),
            eq(resourcePermissions.resourceType, parent.type),
            eq(resourcePermissions.resourceId, parent.id),
            eq(resourcePermissions.permissionName, permissionName)
          )
        });

        if (parentPermission) {
          return parentPermission.granted;
        }
      }

      return null;
    } catch (error) {
      console.error('Inherited permission check error:', error);
      return null;
    }
  }

  /**
   * Get resource hierarchy (parent resources)
   * This is a simplified implementation - in a real system, this would
   * query the database to find parent resources
   */
  private async getResourceHierarchy(
    resourceType: string,
    resourceId: string
  ): Promise<Array<{ type: string; id: string }>> {
    // Example implementation for task -> project hierarchy
    if (resourceType === 'task') {
      try {
        const task = await db.query.tasks.findFirst({
          where: eq(db.tasks.id, resourceId),
          columns: {
            projectId: true
          }
        });

        if (task && task.projectId) {
          return [{ type: 'project', id: task.projectId }];
        }
      } catch (error) {
        console.error('Error getting task hierarchy:', error);
      }
    }

    // Example implementation for subtask -> task -> project hierarchy
    if (resourceType === 'subtask') {
      try {
        const subtask = await db.query.subtasks.findFirst({
          where: eq(db.subtasks.id, resourceId),
          columns: {
            taskId: true
          }
        });

        if (subtask && subtask.taskId) {
          const task = await db.query.tasks.findFirst({
            where: eq(db.tasks.id, subtask.taskId),
            columns: {
              id: true,
              projectId: true
            }
          });

          if (task) {
            const hierarchy = [{ type: 'task', id: task.id }];
            if (task.projectId) {
              hierarchy.push({ type: 'project', id: task.projectId });
            }
            return hierarchy;
          }
        }
      } catch (error) {
        console.error('Error getting subtask hierarchy:', error);
      }
    }

    return [];
  }

  /**
   * Grant a permission to a role
   */
  async grantRolePermission(
    roleId: string,
    permissionName: string
  ): Promise<boolean> {
    try {
      // Get permission ID
      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.name, permissionName)
      });

      if (!permission) {
        return false;
      }

      // Grant permission to role
      await db.insert(rolePermissions)
        .values({
          id: uuidv4(),
          roleId,
          permissionId: permission.id,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoNothing();

      return true;
    } catch (error) {
      console.error('Grant role permission error:', error);
      return false;
    }
  }

  /**
   * Revoke a permission from a role
   */
  async revokeRolePermission(
    roleId: string,
    permissionName: string
  ): Promise<boolean> {
    try {
      // Get permission ID
      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.name, permissionName)
      });

      if (!permission) {
        return false;
      }

      // Revoke permission from role
      await db.delete(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permission.id)
          )
        );

      return true;
    } catch (error) {
      console.error('Revoke role permission error:', error);
      return false;
    }
  }

  /**
   * Grant a resource-specific permission to a user
   */
  async grantResourcePermission(
    userId: string,
    permissionName: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    try {
      await db.insert(resourcePermissions)
        .values({
          id: uuidv4(),
          userId,
          permissionName,
          resourceType,
          resourceId,
          granted: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [
            resourcePermissions.userId,
            resourcePermissions.permissionName,
            resourcePermissions.resourceType,
            resourcePermissions.resourceId
          ],
          set: {
            granted: true,
            updatedAt: new Date()
          }
        });

      return true;
    } catch (error) {
      console.error('Grant resource permission error:', error);
      return false;
    }
  }

  /**
   * Revoke a resource-specific permission from a user
   */
  async revokeResourcePermission(
    userId: string,
    permissionName: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    try {
      await db.insert(resourcePermissions)
        .values({
          id: uuidv4(),
          userId,
          permissionName,
          resourceType,
          resourceId,
          granted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: [
            resourcePermissions.userId,
            resourcePermissions.permissionName,
            resourcePermissions.resourceType,
            resourcePermissions.resourceId
          ],
          set: {
            granted: false,
            updatedAt: new Date()
          }
        });

      return true;
    } catch (error) {
      console.error('Revoke resource permission error:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Get user with role
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
          role: true
        }
      });

      if (!user || !user.role) {
        return [];
      }

      // Get role permissions
      const rolePermissionsList = await db.query.rolePermissions.findMany({
        where: eq(rolePermissions.roleId, user.role.id),
        with: {
          permission: true
        }
      });

      // Get direct user permissions
      const userPermissionsList = await db.query.userPermissions.findMany({
        where: eq(permissions.userId, userId),
        with: {
          permission: true
        }
      });

      // Combine permissions, with user permissions overriding role permissions
      const permissionMap = new Map<string, boolean>();
      
      // Add role permissions
      rolePermissionsList.forEach(rp => {
        permissionMap.set(rp.permission.name, true);
      });
      
      // Override with user permissions
      userPermissionsList.forEach(up => {
        permissionMap.set(up.permission.name, up.granted);
      });
      
      // Return only granted permissions
      return Array.from(permissionMap.entries())
        .filter(([_, granted]) => granted)
        .map(([name, _]) => name);
    } catch (error) {
      console.error('Get user permissions error:', error);
      return [];
    }
  }

  /**
   * Log access events for audit purposes
   */
  private async logAccessEvent(
    userId: string,
    permissionName: string,
    resourceType?: string,
    resourceId?: string
  ): Promise<void> {
    await db.insert({
      table: 'access_logs',
      values: {
        id: uuidv4(),
        userId,
        permissionName,
        resourceType: resourceType || null,
        resourceId: resourceId || null,
        timestamp: new Date(),
        ipAddress: '0.0.0.0', // In a real implementation, get from request
        userAgent: 'Unknown' // In a real implementation, get from request
      }
    });
  }
}

export default new AuthorizationService();
