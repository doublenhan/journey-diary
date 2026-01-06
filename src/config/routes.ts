/**
 * Centralized Route Configuration
 * Single source of truth for all application routes
 */

export const ROUTES = {
  // Public routes
  LOGIN: '/',
  LANDING: '/landing',

  // Main app routes
  CREATE_MEMORY: '/create-memory',
  VIEW_MEMORY: '/view-memory',
  ANNIVERSARY_REMINDERS: '/anniversary-reminders',
  SETTINGS: '/setting-page',

  // Couple routes
  COUPLE_INVITATIONS: '/couple/invitations',
  COUPLE_SETTINGS: '/couple/settings',

  // Admin routes
  ADMIN: '/admin',
  MIGRATION: '/migration',
} as const;

// Type for route values
export type Route = typeof ROUTES[keyof typeof ROUTES];

// Helper functions for dynamic routes (if needed in the future)
export const routeHelpers = {
  memory: (id: string) => `/memory/${id}`,
  profile: (userId: string) => `/profile/${userId}`,
};
