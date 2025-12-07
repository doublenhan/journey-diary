// Authentication API endpoint
// Handles login and sets httpOnly session cookie

import { setSessionCookie, clearSessionCookie } from '../middleware/sessionAuth.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST') {
    const { action, userId } = req.body;

    if (action === 'login') {
      // Validate userId (in real app, verify Firebase token)
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'userId is required'
        });
      }

      // Set session cookie
      try {
        setSessionCookie(res, userId);
        
        return res.status(200).json({
          success: true,
          message: 'Session created',
          userId: userId
        });
      } catch (error) {
        console.error('Session creation error:', error);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to create session'
        });
      }
    } else if (action === 'logout') {
      // Clear session cookie
      clearSessionCookie(res);
      
      return res.status(200).json({
        success: true,
        message: 'Session cleared'
      });
    } else {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid action. Use "login" or "logout"'
      });
    }
  } else if (req.method === 'GET') {
    // Check session status
    const { getSessionFromCookie } = await import('../middleware/sessionAuth.js');
    const session = getSessionFromCookie(req);

    if (session && session.userId) {
      return res.status(200).json({
        authenticated: true,
        userId: session.userId,
        expiresAt: session.expiresAt
      });
    } else {
      return res.status(200).json({
        authenticated: false
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
