// Session management middleware for API endpoints
// Handles httpOnly cookie-based authentication

const SESSION_COOKIE_NAME = 'journey_diary_session';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Set session cookie
 */
export function setSessionCookie(res, userId, expiresIn = SESSION_EXPIRY) {
  const expires = new Date(Date.now() + expiresIn);
  
  // Create session token (in production, use JWT or encrypted token)
  const sessionToken = Buffer.from(JSON.stringify({
    userId,
    createdAt: Date.now(),
    expiresAt: expires.getTime()
  })).toString('base64');

  // Set httpOnly cookie
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE_NAME}=${sessionToken}`,
    `HttpOnly`,
    `Secure`, // HTTPS only
    `SameSite=Strict`, // CSRF protection
    `Path=/`,
    `Max-Age=${expiresIn / 1000}`,
    `Expires=${expires.toUTCString()}`
  ].join('; '));

  return sessionToken;
}

/**
 * Get session from cookie
 */
export function getSessionFromCookie(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  const sessionToken = cookies[SESSION_COOKIE_NAME];
  if (!sessionToken) return null;

  try {
    const sessionData = JSON.parse(
      Buffer.from(sessionToken, 'base64').toString('utf-8')
    );

    // Check expiry
    if (Date.now() > sessionData.expiresAt) {
      return null; // Expired
    }

    return sessionData;
  } catch (error) {
    console.error('Invalid session token:', error);
    return null;
  }
}

/**
 * Clear session cookie (logout)
 */
export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE_NAME}=`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Strict`,
    `Path=/`,
    `Max-Age=0`,
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  ].join('; '));
}

/**
 * Middleware to protect API routes with session authentication
 */
export function withSessionAuth(handler) {
  return async (req, res) => {
    const session = getSessionFromCookie(req);

    if (!session || !session.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid session required. Please log in.'
      });
    }

    // Attach userId to request for use in handler
    req.userId = session.userId;

    return handler(req, res);
  };
}

/**
 * Refresh session cookie (extend expiry)
 */
export function refreshSessionCookie(req, res) {
  const session = getSessionFromCookie(req);
  if (!session) return false;

  // Set new cookie with extended expiry
  setSessionCookie(res, session.userId);
  return true;
}
