import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { roles, permissions, rolePermissions } from '../schema/auth.schema';

async function seedAuthData() {
  try {
    console.log('Seeding initial auth data...');

    // Create default roles
    const roleIds = {
      superAdmin: uuidv4(),
      admin: uuidv4(),
      manager: uuidv4(),
      user: uuidv4()
    };

    await db.insert(roles).values([
      {
        id: roleIds.superAdmin,
        name: 'super_admin',
        description: 'Super administrator with full system access'
      },
      {
        id: roleIds.admin,
        name: 'admin',
        description: 'Administrator with tenant-wide access'
      },
      {
        id: roleIds.manager,
        name: 'manager',
        description: 'Manager with team management capabilities'
      },
      {
        id: roleIds.user,
        name: 'user',
        description: 'Regular user with basic access'
      }
    ]);

    // Create default permissions
    const permissionIds = {
      manageUsers: uuidv4(),
      manageRoles: uuidv4(),
      manageTenants: uuidv4(),
      manageProjects: uuidv4(),
      manageTeams: uuidv4(),
      viewReports: uuidv4(),
      createTasks: uuidv4(),
      updateTasks: uuidv4(),
      deleteTasks: uuidv4(),
      assignTasks: uuidv4()
    };

    await db.insert(permissions).values([
      {
        id: permissionIds.manageUsers,
        name: 'manage_users',
        resource: 'users',
        action: 'manage',
        description: 'Create, update, and delete users'
      },
      {
        id: permissionIds.manageRoles,
        name: 'manage_roles',
        resource: 'roles',
        action: 'manage',
        description: 'Manage roles and permissions'
      },
      {
        id: permissionIds.manageTenants,
        name: 'manage_tenants',
        resource: 'tenants',
        action: 'manage',
        description: 'Manage tenant settings and users'
      },
      {
        id: permissionIds.manageProjects,
        name: 'manage_projects',
        resource: 'projects',
        action: 'manage',
        description: 'Create, update, and delete projects'
      },
      {
        id: permissionIds.manageTeams,
        name: 'manage_teams',
        resource: 'teams',
        action: 'manage',
        description: 'Manage team members and settings'
      },
      {
        id: permissionIds.viewReports,
        name: 'view_reports',
        resource: 'reports',
        action: 'read',
        description: 'View analytics and reports'
      },
      {
        id: permissionIds.createTasks,
        name: 'create_tasks',
        resource: 'tasks',
        action: 'create',
        description: 'Create new tasks'
      },
      {
        id: permissionIds.updateTasks,
        name: 'update_tasks',
        resource: 'tasks',
        action: 'update',
        description: 'Update existing tasks'
      },
      {
        id: permissionIds.deleteTasks,
        name: 'delete_tasks',
        resource: 'tasks',
        action: 'delete',
        description: 'Delete tasks'
      },
      {
        id: permissionIds.assignTasks,
        name: 'assign_tasks',
        resource: 'tasks',
        action: 'assign',
        description: 'Assign tasks to users'
      }
    ]);

    // Assign permissions to roles
    const rolePermissionsData = [
      // Super Admin - all permissions
      ...Object.values(permissionIds).map(permissionId => ({
        roleId: roleIds.superAdmin,
        permissionId,
        grantedAt: new Date()
      })),

      // Admin - most permissions except super admin specific ones
      {
        roleId: roleIds.admin,
        permissionId: permissionIds.manageUsers,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.admin,
        permissionId: permissionIds.manageProjects,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.admin,
        permissionId: permissionIds.manageTeams,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.admin,
        permissionId: permissionIds.viewReports,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.admin,
        permissionId: permissionIds.createTasks,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.admin,
        permissionId: permissionIds.updateTasks,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.admin,
        permissionId: permissionIds.deleteTasks,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.admin,
        permissionId: permissionIds.assignTasks,
        grantedAt: new Date()
      },

      // Manager - team management and task permissions
      {
        roleId: roleIds.manager,
        permissionId: permissionIds.manageTeams,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.manager,
        permissionId: permissionIds.viewReports,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.manager,
        permissionId: permissionIds.createTasks,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.manager,
        permissionId: permissionIds.updateTasks,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.manager,
        permissionId: permissionIds.assignTasks,
        grantedAt: new Date()
      },

      // Regular user - basic task permissions
      {
        roleId: roleIds.user,
        permissionId: permissionIds.createTasks,
        grantedAt: new Date()
      },
      {
        roleId: roleIds.user,
        permissionId: permissionIds.updateTasks,
        grantedAt: new Date()
      }
    ];

    await db.insert(rolePermissions).values(rolePermissionsData);

    console.log('Auth data seeded successfully');
  } catch (error) {
    console.error('Failed to seed auth data:', error);
    throw error;
  }
}

seedAuthData(); 