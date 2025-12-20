/**
 * Role and Permission Utilities
 */

import { UserRole, ROLES, RolePermissions } from '../config/roles';

/**
 * Check if user has permission for specific action on resource
 */
export const hasPermission = (
  userRole: UserRole,
  resource: keyof RolePermissions,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean => {
  const rolePermissions = ROLES[userRole];
  const resourcePermissions = rolePermissions[resource];
  return resourcePermissions[action];
};

/**
 * Check if user can perform action on memories
 */
export const canManageMemories = (userRole: UserRole): boolean => {
  return (
    hasPermission(userRole, 'memories', 'create') &&
    hasPermission(userRole, 'memories', 'update') &&
    hasPermission(userRole, 'memories', 'delete')
  );
};

/**
 * Check if user can perform action on anniversaries
 */
export const canManageAnniversaries = (userRole: UserRole): boolean => {
  return (
    hasPermission(userRole, 'anniversaries', 'create') &&
    hasPermission(userRole, 'anniversaries', 'update') &&
    hasPermission(userRole, 'anniversaries', 'delete')
  );
};

/**
 * Check if user can manage other users (admin only)
 */
export const canManageUsers = (userRole: UserRole): boolean => {
  return (
    hasPermission(userRole, 'users', 'read') &&
    hasPermission(userRole, 'users', 'update')
  );
};

/**
 * Check if user is admin
 */
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === 'SysAdmin';
};

/**
 * Check if user is regular user
 */
export const isRegularUser = (userRole: UserRole): boolean => {
  return userRole === 'User';
};

/**
 * Get user role label
 */
export const getRoleLabel = (userRole: UserRole): string => {
  return userRole === 'SysAdmin' ? 'System Administrator' : 'User';
};

/**
 * Validate role type
 */
export const isValidRole = (role: any): role is UserRole => {
  return role === 'User' || role === 'SysAdmin';
};
