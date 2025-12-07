// Security Dashboard Component
// Displays security monitoring statistics and recent events

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { getSecuritySummary, getRecentSecurityEvents, SecurityEvent } from '../utils/securityMonitoring';

export function SecurityDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [timeWindow, setTimeWindow] = useState(24); // hours

  useEffect(() => {
    const updateData = () => {
      const windowMs = timeWindow * 60 * 60 * 1000;
      setSummary(getSecuritySummary(windowMs));
      setRecentEvents(getRecentSecurityEvents(20));
    };

    updateData();
    const interval = setInterval(updateData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [timeWindow]);

  if (!summary) return null;

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'LOGIN_SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'LOGIN_FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'SUSPICIOUS_ACTIVITY': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'RATE_LIMIT_EXCEEDED': return <Shield className="w-4 h-4 text-yellow-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleString();
  };

  return (
    <div className="security-dashboard bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Security Monitoring</h2>
        <select 
          value={timeWindow} 
          onChange={(e) => setTimeWindow(Number(e.target.value))}
          className="ml-auto px-3 py-1 border rounded-lg text-sm"
        >
          <option value={1}>Last Hour</option>
          <option value={6}>Last 6 Hours</option>
          <option value={24}>Last 24 Hours</option>
          <option value={168}>Last Week</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Events</span>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{summary.totalEvents}</div>
        </div>

        <div className="stat-card bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Successful Logins</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{summary.successfulLogins}</div>
        </div>

        <div className="stat-card bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Failed Logins</span>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{summary.failedLogins}</div>
        </div>

        <div className="stat-card bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Suspicious Activity</span>
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-800">{summary.suspiciousActivities}</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Rate Limits</div>
          <div className="text-xl font-semibold">{summary.rateLimitViolations}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Password Resets</div>
          <div className="text-xl font-semibold">{summary.passwordResets}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Unique Users</div>
          <div className="text-xl font-semibold">{summary.uniqueUsers}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Unique IPs</div>
          <div className="text-xl font-semibold">{summary.uniqueIPs}</div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="recent-events">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Security Events
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentEvents.map((event, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {getEventIcon(event.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">
                  {event.type.replace(/_/g, ' ')}
                </div>
                {event.userId && (
                  <div className="text-xs text-gray-500">
                    User: {event.userId.substring(0, 8)}...
                  </div>
                )}
                {event.details && (
                  <div className="text-xs text-gray-500 truncate">
                    {JSON.stringify(event.details)}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap">
                {formatTimestamp(event.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
