/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines roles and their permissions for the Love Diary app
 */

export type UserRole = 'User' | 'SysAdmin';

export interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface RolePermissions {
  memories: Permission;
  anniversaries: Permission;
  profile: Permission;
  users: Permission;
  system: Permission;
}

/**
 * Role definitions and their permissions
 */
export const ROLES: Record<UserRole, RolePermissions> = {
  User: {
    memories: {
      create: true,
      read: true,
      update: true,
      delete: true
    },
    anniversaries: {
      create: true,
      read: true,
      update: true,
      delete: true
    },
    profile: {
      create: true,
      read: true,
      update: true,
      delete: false // Cannot delete profile directly
    },
    users: {
      create: false,
      read: false,
      update: false,
      delete: false
    },
    system: {
      create: false,
      read: false,
      update: false,
      delete: false
    }
  },
  SysAdmin: {
    memories: {
      create: true,
      read: true,
      update: true,
      delete: true
    },
    anniversaries: {
      create: true,
      read: true,
      update: true,
      delete: true
    },
    profile: {
      create: true,
      read: true,
      update: true,
      delete: true
    },
    users: {
      create: true,
      read: true,
      update: true,
      delete: true
    },
    system: {
      create: true,
      read: true,
      update: true,
      delete: true
    }
  }
};

/**
 * Default role for new users
 */
export const DEFAULT_USER_ROLE: UserRole = 'User';

/**
 * Admin access code (should be environment variable in production)
 * Format: When user enters this code + admin email, they get SysAdmin role
 */
export const ADMIN_ACCESS_CODE = import.meta.env.VITE_ADMIN_CODE || 'ADMIN_SECRET_2024';

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  User: 'Regular user - Can create, read, update, delete personal memories and anniversaries',
  SysAdmin: 'System Administrator - Full access to all user data and system settings'
};
