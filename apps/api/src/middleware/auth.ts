import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { UserRole } from '@exitprep/shared';
import { dbStore } from '../db.js';

export interface AuthUserPayload {
  userId: string;
  email?: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      sessionId?: string;
    }
  }
}

/**
 * Authenticates requests via HttpOnly session cookie OR Bearer authorization header.
 * Enforces session validity, expiration checks, and active user status.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  // Check HttpOnly session cookie first, then fallback to Authorization header
  const cookieToken = req.cookies?.exitprep_session;
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  const token = cookieToken || headerToken;

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please sign in.' },
    });
    return;
  }

  // 1. Check persistent database/memory session
  const session = dbStore.sessions.find((s) => s.token === token);
  if (session) {
    if (session.revokedAt || new Date(session.expiresAt) < new Date()) {
      res.status(401).json({
        success: false,
        error: { code: 'SESSION_EXPIRED', message: 'Your session has expired or was revoked. Please log in again.' },
      });
      return;
    }

    const user = dbStore.users.find((u) => u.id === session.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Session owner could not be located.' },
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by an administrator.' },
      });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      sessionId: session.id,
    };
    req.sessionId = session.id;
    next();
    return;
  }

  // 2. Fallback to JWT verification (for API clients or dev tokens)
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthUserPayload;
    const user = dbStore.users.find((u) => u.id === payload.userId);

    if (user && !user.isActive) {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended by an administrator.' },
      });
      return;
    }

    req.user = user
      ? {
          userId: user.id,
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
          role: user.role,
        }
      : payload;

    next();
  } catch {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Invalid or expired authentication credentials.' },
    });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware generator.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions. Access restricted to: ${allowedRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}

/** Pre-configured role guards */
export const requireSuperAdmin = requireRole([UserRole.SUPER_ADMINISTRATOR]);
export const requirePaymentAdmin = requireRole([UserRole.SUPER_ADMINISTRATOR, UserRole.PAYMENT_ADMINISTRATOR]);
export const requireAcademicReviewer = requireRole([UserRole.SUPER_ADMINISTRATOR, UserRole.REVIEWER]);
export const requireContentEditor = requireRole([UserRole.SUPER_ADMINISTRATOR, UserRole.CONTENT_EDITOR]);
export const requireStaff = requireRole([
  UserRole.SUPER_ADMINISTRATOR,
  UserRole.PAYMENT_ADMINISTRATOR,
  UserRole.REVIEWER,
  UserRole.CONTENT_EDITOR,
]);
