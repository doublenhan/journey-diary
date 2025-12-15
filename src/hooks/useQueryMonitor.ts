/**
 * Query Performance Hook
 * 
 * React hook for monitoring query performance in components
 */

import { useEffect, useState } from 'react';
import { queryMonitor, QueryStats } from '../utils/queryMonitor';

export interface UseQueryMonitorOptions {
  collectionName?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

/**
 * Hook to monitor query performance statistics
 */
export function useQueryMonitor(options: UseQueryMonitorOptions = {}) {
  const {
    collectionName,
    autoRefresh = false,
    refreshInterval = 5000,
  } = options;

  const [stats, setStats] = useState<QueryStats>(() => 
    queryMonitor.getStats(collectionName)
  );

  const [recommendations, setRecommendations] = useState<string[]>(() =>
    queryMonitor.getRecommendations()
  );

  const refresh = () => {
    setStats(queryMonitor.getStats(collectionName));
    setRecommendations(queryMonitor.getRecommendations());
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, collectionName]);

  const clear = () => {
    queryMonitor.clear();
    refresh();
  };

  const printStats = () => {
    queryMonitor.printStats(collectionName);
  };

  return {
    stats,
    recommendations,
    refresh,
    clear,
    printStats,
  };
}

/**
 * Hook to get recent query metrics
 */
export function useRecentQueries(count: number = 10) {
  const [queries, setQueries] = useState(() => 
    queryMonitor.getRecentMetrics(count)
  );

  const refresh = () => {
    setQueries(queryMonitor.getRecentMetrics(count));
  };

  return {
    queries,
    refresh,
  };
}

/**
 * Hook to get metrics for a specific query
 */
export function useQueryMetrics(queryName: string) {
  const [metrics, setMetrics] = useState(() => 
    queryMonitor.getQueryMetrics(queryName)
  );

  const refresh = () => {
    setMetrics(queryMonitor.getQueryMetrics(queryName));
  };

  return {
    metrics,
    refresh,
  };
}

export default useQueryMonitor;
