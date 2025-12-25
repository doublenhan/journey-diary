/**
 * Performance Monitoring Utilities
 * Helper functions to track custom traces for critical operations
 */

import { performance } from '../firebase/firebaseConfig';
import { trace } from 'firebase/performance';

/**
 * Start a custom trace to measure operation duration
 * @param traceName - Name of the operation being tracked
 * @returns Trace object with start/stop methods
 */
export const startTrace = (traceName: string) => {
  if (!performance) {
    // If performance monitoring is not available, return a no-op trace
    return {
      start: () => {},
      stop: () => {},
      putAttribute: () => {},
      putMetric: () => {},
    };
  }

  const customTrace = trace(performance, traceName);
  customTrace.start();
  
  return customTrace;
};

/**
 * Track memory creation performance
 */
export const trackMemoryCreation = () => {
  return startTrace('memory_creation');
};

/**
 * Track memory loading performance
 */
export const trackMemoryLoad = () => {
  return startTrace('memory_load');
};

/**
 * Track image upload performance
 */
export const trackImageUpload = () => {
  return startTrace('image_upload');
};

/**
 * Track search performance
 */
export const trackSearch = () => {
  return startTrace('search_operation');
};

/**
 * Track filter performance
 */
export const trackFilter = () => {
  return startTrace('filter_operation');
};

/**
 * Track authentication operations
 */
export const trackAuth = (operation: 'login' | 'signup' | 'logout') => {
  return startTrace(`auth_${operation}`);
};

/**
 * Track map rendering performance
 */
export const trackMapRender = () => {
  return startTrace('map_render');
};

/**
 * Track export operations
 */
export const trackExport = (format: 'pdf' | 'calendar') => {
  return startTrace(`export_${format}`);
};

/**
 * Wrapper to measure async function performance
 */
export async function measurePerformance<T>(
  traceName: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string>
): Promise<T> {
  const customTrace = startTrace(traceName);
  
  // Add custom attributes
  if (attributes && performance) {
    Object.entries(attributes).forEach(([key, value]) => {
      customTrace.putAttribute(key, value);
    });
  }
  
  try {
    const result = await fn();
    customTrace.stop();
    return result;
  } catch (error) {
    if (performance) {
      customTrace.putAttribute('error', 'true');
    }
    customTrace.stop();
    throw error;
  }
}

/**
 * Example usage:
 * 
 * // Simple trace
 * const trace = trackMemoryCreation();
 * await createMemory(data);
 * trace.stop();
 * 
 * // With wrapper
 * await measurePerformance('create_memory', async () => {
 *   return await createMemory(data);
 * }, { image_count: photos.length.toString() });
 */
