/**
 * Query Performance Dashboard
 * 
 * Debug component to visualize Firestore query performance
 * Only visible in development mode
 */

import { useState } from 'react';
import { useQueryMonitor } from '../hooks/useQueryMonitor';
import { Clock, Database, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

export function QueryPerformanceDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const { stats, recommendations, refresh, clear, printStats } = useQueryMonitor({
    autoRefresh: true,
    refreshInterval: 5000,
  });

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        title="Query Performance Monitor"
      >
        <Database className="w-4 h-4" />
        <span className="text-sm font-medium">
          {stats.totalQueries} queries
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-[600px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          <h3 className="font-semibold">Query Performance</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-3 border-b border-gray-200 bg-gray-50">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Database className="w-4 h-4" />
            <span className="text-xs font-medium">Total Queries</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalQueries}
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Avg Time</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.averageExecutionTime.toFixed(0)}ms
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Cache Hit</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.cacheHitRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Database className="w-4 h-4" />
            <span className="text-xs font-medium">Doc Reads</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalDocumentReads}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-yellow-50">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <AlertCircle className="w-4 h-4" />
            <h4 className="text-sm font-semibold">Recommendations</h4>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded"
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slow Queries */}
      {stats.slowQueries.length > 0 && (
        <div className="flex-1 overflow-auto p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Slow Queries (&gt;1s)
          </h4>
          <div className="space-y-2">
            {stats.slowQueries.map((query, index) => (
              <div
                key={index}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-red-900">
                    {query.queryName}
                  </span>
                  <span className="text-xs font-bold text-red-700">
                    {query.executionTime.toFixed(0)}ms
                  </span>
                </div>
                <div className="text-xs text-red-600">
                  {query.documentCount} docs from {query.collectionName}
                </div>
                {query.filters && (
                  <div className="text-xs text-red-500 mt-1 font-mono">
                    {JSON.stringify(query.filters)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
        <button
          onClick={printStats}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
        >
          Print to Console
        </button>
        <button
          onClick={clear}
          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
        >
          Clear Data
        </button>
      </div>
    </div>
  );
}

export default QueryPerformanceDashboard;
