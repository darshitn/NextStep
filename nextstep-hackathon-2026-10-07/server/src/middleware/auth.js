import { verifyUser, createScopedClient } from '../lib/supabase.js';

/**
 * Authentication middleware for private routes.
 * Validates Bearer token using Supabase Auth.
 * Attaches req.user and a per-request scoped Supabase client with user's JWT.
 */
export async function requireAuth(req, res, next) {
  try {
    // Check if test mock handler is present in app.locals (used for synthetic unit/integration tests)
    if (req.app.locals.mockAuthHandler) {
      return req.app.locals.mockAuthHandler(req, res, next);
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or malformed Authorization header. Expected Bearer token.'
        }
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bearer token cannot be empty.'
        }
      });
    }

    const user = await verifyUser(token);
    req.user = user;
    req.token = token;
    req.supabase = createScopedClient(token);

    next();
  } catch (err) {
    const status = err.status || 401;
    return res.status(status).json({
      error: {
        code: err.code || 'UNAUTHORIZED',
        message: err.message || 'Authentication failed.'
      }
    });
  }
}
