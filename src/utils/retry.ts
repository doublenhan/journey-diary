/**
 * Retry utility for failed API calls with exponential backoff
 */
import React from 'react';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true; // Network error
    const status = error.response?.status || error.status;
    return status >= 500 && status < 600;
  },
  onRetry: () => {}
};

/**
 * Retry a promise-returning function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt < opts.maxRetries && opts.shouldRetry(error, attempt)) {
        // Calculate delay with exponential backoff
        const delay = Math.min(
          opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
          opts.maxDelay
        );
        
        // Notify about retry
        opts.onRetry(error, attempt + 1, delay);
        
        // Wait before retrying
        await sleep(delay);
      } else {
        // No more retries or shouldn't retry this error
        throw error;
      }
    }
  }
  
  throw lastError;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a retry wrapper for API functions
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return retryWithBackoff(() => fn(...args), options);
  }) as T;
}

/**
 * Retry hook for React components
 */
export function useRetryableRequest<T>(
  requestFn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const execute = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      const result = await retryWithBackoff(requestFn, {
        ...options,
        onRetry: (err, attempt, delay) => {
          setRetryCount(attempt);
          options.onRetry?.(err, attempt, delay);
        }
      });
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [requestFn, options]);

  return {
    data,
    loading,
    error,
    retryCount,
    execute,
    retry: execute
  };
}

/**
 * Example usage:
 * 
 * // Simple retry
 * const data = await retryWithBackoff(() => fetchData(), {
 *   maxRetries: 3,
 *   initialDelay: 1000
 * });
 * 
 * // Wrap API function
 * const fetchDataWithRetry = withRetry(fetchData, { maxRetries: 3 });
 * 
 * // Use in React component
 * const { data, loading, error, retry } = useRetryableRequest(
 *   () => api.getMemories(),
 *   { maxRetries: 3 }
 * );
 */
