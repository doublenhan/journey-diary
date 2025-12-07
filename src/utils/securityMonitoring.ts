// Security monitoring and logging utility
// Tracks security events, failed logins, suspicious activities

export interface SecurityEvent {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'SESSION_EXPIRED' | 
        'RATE_LIMIT_EXCEEDED' | 'INVALID_SESSION' | 'PASSWORD_RESET_REQUESTED' |
        'SUSPICIOUS_ACTIVITY' | 'UNAUTHORIZED_ACCESS';
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: number;
  details?: any;
}

// In-memory event store (will be persisted to Firestore in production)
const securityEvents: SecurityEvent[] = [];
const MAX_EVENTS = 1000; // Keep last 1000 events in memory

/**
 * Log security event
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: Date.now()
  };

  // Add to in-memory store
  securityEvents.unshift(fullEvent);
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.pop();
  }

  // Console log for debugging
  const emoji = getEventEmoji(event.type);
  console.log(`${emoji} [SECURITY] ${event.type}:`, {
    userId: event.userId || 'anonymous',
    ip: event.ip || 'unknown',
    details: event.details
  });

  // TODO: Send to Firebase Analytics
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', event.type, {
  //     userId: event.userId,
  //     ip: event.ip,
  //     ...event.details
  //   });
  // }

  // Check for suspicious patterns
  checkSuspiciousActivity(fullEvent);
}

/**
 * Get recent security events
 */
export function getRecentSecurityEvents(limit = 100): SecurityEvent[] {
  return securityEvents.slice(0, limit);
}

/**
 * Get security events by user
 */
export function getSecurityEventsByUser(userId: string, limit = 50): SecurityEvent[] {
  return securityEvents
    .filter(event => event.userId === userId)
    .slice(0, limit);
}

/**
 * Get failed login attempts by IP
 */
export function getFailedLoginsByIp(ip: string, timeWindow = 15 * 60 * 1000): SecurityEvent[] {
  const now = Date.now();
  return securityEvents.filter(event => 
    event.type === 'LOGIN_FAILED' &&
    event.ip === ip &&
    (now - event.timestamp) < timeWindow
  );
}

/**
 * Check if IP should be blocked (too many failed attempts)
 */
export function shouldBlockIp(ip: string): boolean {
  const failedAttempts = getFailedLoginsByIp(ip);
  return failedAttempts.length >= 5; // Block after 5 failed attempts in 15 minutes
}

/**
 * Check for suspicious activity patterns
 */
function checkSuspiciousActivity(event: SecurityEvent) {
  // Check for rapid failed login attempts
  if (event.type === 'LOGIN_FAILED' && event.ip) {
    const recentFailed = getFailedLoginsByIp(event.ip);
    if (recentFailed.length >= 3) {
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: event.ip,
        userId: event.userId,
        details: {
          reason: 'Multiple failed login attempts',
          count: recentFailed.length,
          pattern: 'BRUTE_FORCE'
        }
      });
    }
  }

  // Check for session anomalies
  if (event.type === 'LOGIN_SUCCESS' && event.userId) {
    const recentLogins = securityEvents.filter(e => 
      e.type === 'LOGIN_SUCCESS' &&
      e.userId === event.userId &&
      (Date.now() - e.timestamp) < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentLogins.length > 3) {
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        userId: event.userId,
        ip: event.ip,
        details: {
          reason: 'Multiple rapid logins',
          count: recentLogins.length,
          pattern: 'ACCOUNT_TAKEOVER'
        }
      });
    }
  }

  // Check for rate limit violations
  if (event.type === 'RATE_LIMIT_EXCEEDED' && event.ip) {
    const recentRateLimits = securityEvents.filter(e =>
      e.type === 'RATE_LIMIT_EXCEEDED' &&
      e.ip === event.ip &&
      (Date.now() - e.timestamp) < 60 * 60 * 1000 // Last hour
    );

    if (recentRateLimits.length >= 5) {
      logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        ip: event.ip,
        details: {
          reason: 'Repeated rate limit violations',
          count: recentRateLimits.length,
          pattern: 'DDOS_ATTEMPT'
        }
      });
    }
  }
}

/**
 * Get emoji for event type
 */
function getEventEmoji(type: SecurityEvent['type']): string {
  const emojiMap: Record<SecurityEvent['type'], string> = {
    LOGIN_SUCCESS: '✅',
    LOGIN_FAILED: '❌',
    LOGOUT: '👋',
    SESSION_EXPIRED: '⏰',
    RATE_LIMIT_EXCEEDED: '🚫',
    INVALID_SESSION: '🔒',
    PASSWORD_RESET_REQUESTED: '🔑',
    SUSPICIOUS_ACTIVITY: '⚠️',
    UNAUTHORIZED_ACCESS: '🛑'
  };
  return emojiMap[type] || '📋';
}

/**
 * Get security summary statistics
 */
export function getSecuritySummary(timeWindow = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const recentEvents = securityEvents.filter(e => (now - e.timestamp) < timeWindow);

  return {
    totalEvents: recentEvents.length,
    loginAttempts: recentEvents.filter(e => e.type === 'LOGIN_SUCCESS' || e.type === 'LOGIN_FAILED').length,
    successfulLogins: recentEvents.filter(e => e.type === 'LOGIN_SUCCESS').length,
    failedLogins: recentEvents.filter(e => e.type === 'LOGIN_FAILED').length,
    rateLimitViolations: recentEvents.filter(e => e.type === 'RATE_LIMIT_EXCEEDED').length,
    suspiciousActivities: recentEvents.filter(e => e.type === 'SUSPICIOUS_ACTIVITY').length,
    passwordResets: recentEvents.filter(e => e.type === 'PASSWORD_RESET_REQUESTED').length,
    uniqueUsers: new Set(recentEvents.map(e => e.userId).filter(Boolean)).size,
    uniqueIPs: new Set(recentEvents.map(e => e.ip).filter(Boolean)).size
  };
}

/**
 * Export events for analysis (CSV format)
 */
export function exportSecurityEventsCSV(): string {
  const headers = ['Timestamp', 'Type', 'User ID', 'IP', 'Details'];
  const rows = securityEvents.map(event => [
    new Date(event.timestamp).toISOString(),
    event.type,
    event.userId || '',
    event.ip || '',
    JSON.stringify(event.details || {})
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}
