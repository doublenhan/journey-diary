// Rate limiter middleware for API protection
// Prevents brute-force attacks and DDoS

const rateLimitStore = new Map();

// Configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Max requests per window
const STRICT_ENDPOINTS_LIMIT = 10; // For auth endpoints

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.resetTime > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function getRateLimiter(limit = MAX_REQUESTS) {
  return function rateLimitMiddleware(req, res, next) {
    // Get client IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               'unknown';

    const now = Date.now();
    const key = `${ip}:${req.url}`;

    // Get or create rate limit entry
    let limitEntry = rateLimitStore.get(key);

    if (!limitEntry || now > limitEntry.resetTime) {
      // New window
      limitEntry = {
        count: 0,
        resetTime: now + RATE_LIMIT_WINDOW,
        firstRequest: now
      };
      rateLimitStore.set(key, limitEntry);
    }

    // Increment counter
    limitEntry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - limitEntry.count));
    res.setHeader('X-RateLimit-Reset', new Date(limitEntry.resetTime).toISOString());

    // Check if limit exceeded
    if (limitEntry.count > limit) {
      const retryAfter = Math.ceil((limitEntry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      console.warn(`Rate limit exceeded for IP: ${ip}, endpoint: ${req.url}`);
      
      // Log security event (fire and forget - no await needed)
      // Skip in API context as securityMonitoring is client-side only
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter: retryAfter
      });
    }

    // Continue to next middleware
    if (next) next();
  };
}

// Strict rate limiter for authentication endpoints
export const strictRateLimiter = getRateLimiter(STRICT_ENDPOINTS_LIMIT);

// Standard rate limiter
export const standardRateLimiter = getRateLimiter(MAX_REQUESTS);

// Helper to apply rate limiting to serverless function
export function withRateLimit(handler, limit = MAX_REQUESTS) {
  const limiter = getRateLimiter(limit);
  
  return async (req, res) => {
    return new Promise((resolve, reject) => {
      limiter(req, res, async () => {
        try {
          const result = await handler(req, res);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  };
}
