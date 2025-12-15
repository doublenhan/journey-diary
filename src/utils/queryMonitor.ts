/**
 * Query Performance Monitor - V3.0
 * 
 * Monitors Firestore query performance and provides analytics
 * - Track query execution time
 * - Monitor document reads count
 * - Detect slow queries
 * - Cache performance metrics
 * - Alert on performance issues
 */

export interface QueryMetrics {
  queryName: string;
  collectionName: string;
  executionTime: number; // milliseconds
  documentCount: number;
  timestamp: number;
  filters?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  fromCache?: boolean;
}

export interface QueryStats {
  totalQueries: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  slowQueries: QueryMetrics[];
  cacheHitRate: number;
  totalDocumentReads: number;
}

class QueryMonitor {
  private metrics: QueryMetrics[] = [];
  private readonly MAX_METRICS = 100; // Keep last 100 queries
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly CACHE_KEY = 'queryMetrics';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Start monitoring a query
   */
  startQuery(queryName: string, collectionName: string, options?: {
    filters?: Record<string, any>;
    orderBy?: string;
    limit?: number;
  }): () => void {
    const startTime = performance.now();
    
    // Return a function to end monitoring
    return (documentCount: number = 0, fromCache: boolean = false) => {
      const executionTime = performance.now() - startTime;
      
      const metric: QueryMetrics = {
        queryName,
        collectionName,
        executionTime,
        documentCount,
        timestamp: Date.now(),
        filters: options?.filters,
        orderBy: options?.orderBy,
        limit: options?.limit,
        fromCache,
      };

      this.recordMetric(metric);

      // Log slow queries
      if (executionTime > this.SLOW_QUERY_THRESHOLD) {
        console.warn(`🐌 Slow query detected: ${queryName} (${executionTime.toFixed(2)}ms)`);
      }

      // Log to console in development
      if (import.meta.env.DEV) {
        const cacheStr = fromCache ? ' [CACHE]' : '';
        console.log(
          `📊 ${queryName}${cacheStr}: ${executionTime.toFixed(2)}ms, ${documentCount} docs`
        );
      }
    };
  }

  /**
   * Record a query metric
   */
  private recordMetric(metric: QueryMetrics): void {
    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Save to localStorage periodically
    if (this.metrics.length % 10 === 0) {
      this.saveToStorage();
    }
  }

  /**
   * Get statistics for all queries
   */
  getStats(collectionName?: string): QueryStats {
    const filteredMetrics = collectionName
      ? this.metrics.filter(m => m.collectionName === collectionName)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        totalQueries: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        slowQueries: [],
        cacheHitRate: 0,
        totalDocumentReads: 0,
      };
    }

    const totalQueries = filteredMetrics.length;
    const totalExecutionTime = filteredMetrics.reduce((sum, m) => sum + m.executionTime, 0);
    const averageExecutionTime = totalExecutionTime / totalQueries;
    const slowQueries = filteredMetrics
      .filter(m => m.executionTime > this.SLOW_QUERY_THRESHOLD)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10); // Top 10 slowest
    
    const cachedQueries = filteredMetrics.filter(m => m.fromCache).length;
    const cacheHitRate = (cachedQueries / totalQueries) * 100;
    
    const totalDocumentReads = filteredMetrics.reduce((sum, m) => sum + m.documentCount, 0);

    return {
      totalQueries,
      totalExecutionTime,
      averageExecutionTime,
      slowQueries,
      cacheHitRate,
      totalDocumentReads,
    };
  }

  /**
   * Get metrics for a specific query
   */
  getQueryMetrics(queryName: string): QueryMetrics[] {
    return this.metrics.filter(m => m.queryName === queryName);
  }

  /**
   * Get recent metrics (last N)
   */
  getRecentMetrics(count: number = 10): QueryMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.saveToStorage();
  }

  /**
   * Print statistics to console
   */
  printStats(collectionName?: string): void {
    const stats = this.getStats(collectionName);
    const collectionStr = collectionName ? ` (${collectionName})` : '';

    console.group(`📊 Query Performance Stats${collectionStr}`);
    console.log(`Total Queries: ${stats.totalQueries}`);
    console.log(`Average Execution Time: ${stats.averageExecutionTime.toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${stats.cacheHitRate.toFixed(1)}%`);
    console.log(`Total Document Reads: ${stats.totalDocumentReads}`);
    
    if (stats.slowQueries.length > 0) {
      console.group(`🐌 Slow Queries (>${this.SLOW_QUERY_THRESHOLD}ms)`);
      stats.slowQueries.forEach(q => {
        console.log(
          `  ${q.queryName}: ${q.executionTime.toFixed(2)}ms, ${q.documentCount} docs`
        );
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(): string[] {
    const stats = this.getStats();
    const recommendations: string[] = [];

    // Check cache hit rate
    if (stats.cacheHitRate < 30 && stats.totalQueries > 20) {
      recommendations.push(
        '🔄 Low cache hit rate (<30%). Consider enabling Firebase offline persistence.'
      );
    }

    // Check for slow queries
    if (stats.slowQueries.length > 5) {
      recommendations.push(
        `🐌 ${stats.slowQueries.length} slow queries detected. Review query structure and add composite indexes.`
      );
    }

    // Check average execution time
    if (stats.averageExecutionTime > 500) {
      recommendations.push(
        '⏱️ Average query time >500ms. Consider pagination and limit() clauses.'
      );
    }

    // Check document reads
    const avgDocsPerQuery = stats.totalDocumentReads / stats.totalQueries;
    if (avgDocsPerQuery > 50) {
      recommendations.push(
        `📄 Fetching average ${avgDocsPerQuery.toFixed(0)} docs per query. Use limit() to reduce reads.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Query performance looks good!');
    }

    return recommendations;
  }

  /**
   * Save metrics to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(
        this.CACHE_KEY,
        JSON.stringify({
          metrics: this.metrics.slice(-50), // Save last 50
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn('Failed to save query metrics:', e);
    }
  }

  /**
   * Load metrics from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.CACHE_KEY);
      if (data) {
        const { metrics, timestamp } = JSON.parse(data);
        // Only load if less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          this.metrics = metrics;
        }
      }
    } catch (e) {
      console.warn('Failed to load query metrics:', e);
    }
  }
}

// Singleton instance
export const queryMonitor = new QueryMonitor();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).queryMonitor = queryMonitor;
}

export default queryMonitor;
